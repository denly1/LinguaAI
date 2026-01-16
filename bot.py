import asyncio
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp
import asyncpg
import yaml
from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from dotenv import load_dotenv

import admin_panel
import admin_handlers


@dataclass(frozen=True)
class Config:
    bot_token: str
    admin_chat_ids: List[int]
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str
    bitrix_webhook_url: Optional[str] = None


def load_config() -> Config:
    load_dotenv()
    bitrix_url = os.getenv("BITRIX_WEBHOOK_URL", "")
    bitrix_webhook = bitrix_url if bitrix_url and bitrix_url.startswith("http") else None
    token = os.getenv("BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("BOT_TOKEN is not set")

    raw_admins = os.getenv("ADMIN_CHAT_IDS", "").strip()
    if not raw_admins:
        raise RuntimeError("ADMIN_CHAT_IDS is not set")

    admin_chat_ids: List[int] = []
    for part in raw_admins.split(","):
        part = part.strip()
        if not part:
            continue
        admin_chat_ids.append(int(part))

    return Config(
        bot_token=token,
        admin_chat_ids=admin_chat_ids,
        db_host=os.getenv("DB_HOST", "localhost"),
        db_port=int(os.getenv("DB_PORT", "5432")),
        db_name=os.getenv("DB_NAME", "Clinicapro"),
        db_user=os.getenv("DB_USER", "postgres"),
        db_password=os.getenv("DB_PASSWORD", "1"),
        bitrix_webhook_url=bitrix_webhook,
    )


def load_texts() -> Dict[str, Any]:
    with open("texts.yml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


TEXTS = load_texts()


class HandoffState(StatesGroup):
    waiting_call_doctor_type = State()
    waiting_call_doctor_other_text = State()

    waiting_appointment_type = State()
    waiting_appointment_text = State()

    waiting_admin_topic = State()
    waiting_admin_text = State()


DB_POOL: Optional[asyncpg.Pool] = None


async def init_db_pool(cfg: Config) -> asyncpg.Pool:
    return await asyncpg.create_pool(
        host=cfg.db_host,
        port=cfg.db_port,
        database=cfg.db_name,
        user=cfg.db_user,
        password=cfg.db_password,
        min_size=2,
        max_size=10,
    )


async def ensure_user(user_id: int, username: Optional[str], first_name: Optional[str], last_name: Optional[str]) -> None:
    async with DB_POOL.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO users (user_id, username, first_name, last_name, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                updated_at = NOW()
            """,
            user_id, username, first_name, last_name
        )


async def save_request(user_id: int, scenario: str, topic: Optional[str], description: str) -> None:
    async with DB_POOL.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO requests (user_id, scenario, topic, description, created_at, status)
            VALUES ($1, $2, $3, $4, NOW(), 'new')
            """,
            user_id, scenario, topic, description
        )


async def set_handoff(user_id: int, is_handoff: bool) -> None:
    async with DB_POOL.acquire() as conn:
        if is_handoff:
            await conn.execute(
                """
                INSERT INTO handoff_state (user_id, is_handoff, handoff_at)
                VALUES ($1, TRUE, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    is_handoff = TRUE,
                    handoff_at = NOW(),
                    cleared_at = NULL
                """,
                user_id
            )
        else:
            await conn.execute(
                """
                INSERT INTO handoff_state (user_id, is_handoff, cleared_at)
                VALUES ($1, FALSE, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    is_handoff = FALSE,
                    cleared_at = NOW()
                """,
                user_id
            )


async def is_user_in_handoff(user_id: int) -> bool:
    async with DB_POOL.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT is_handoff FROM handoff_state WHERE user_id = $1",
            user_id
        )
        return row["is_handoff"] if row else False


async def get_user_id_from_request(request_id: int) -> Optional[int]:
    async with DB_POOL.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT user_id FROM requests WHERE id = $1",
            request_id
        )
        return row["user_id"] if row else None


async def save_request_with_id(user_id: int, scenario: str, topic: Optional[str], description: str) -> int:
    async with DB_POOL.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO requests (user_id, scenario, topic, description, created_at, status)
            VALUES ($1, $2, $3, $4, NOW(), 'new')
            RETURNING id
            """,
            user_id, scenario, topic, description
        )
        return row["id"]


async def create_bitrix_lead(user_id: int, username: Optional[str], first_name: Optional[str], scenario: str, topic: Optional[str], description: str) -> bool:
    """
    Создаёт лид в Bitrix24 CRM через вебхук.
    Возвращает True при успехе, False при ошибке.
    """
    cfg = load_config()
    
    if not cfg.bitrix_webhook_url:
        return False
    
    # Формируем имя контакта
    contact_name = first_name or username or f"User {user_id}"
    
    # Формируем заголовок лида
    title = f"{scenario}"
    if topic:
        title += f" - {topic}"
    
    # Формируем комментарий
    comments = f"Сценарий: {scenario}\n"
    if topic:
        comments += f"Тема: {topic}\n"
    comments += f"Описание: {description}\n\n"
    comments += f"Telegram ID: {user_id}\n"
    if username:
        comments += f"Username: @{username}\n"
    
    # Данные для Bitrix24
    payload = {
        "fields": {
            "TITLE": title,
            "NAME": contact_name,
            "COMMENTS": comments,
            "SOURCE_ID": "TELEGRAM",
            "SOURCE_DESCRIPTION": f"Telegram Bot - {scenario}",
            "OPENED": "Y",
            "ASSIGNED_BY_ID": 1,  # ID ответственного (можно настроить)
        }
    }
    
    # Если есть username, добавляем в контакты
    if username:
        payload["fields"]["IM"] = [
            {
                "VALUE": f"@{username}",
                "VALUE_TYPE": "TELEGRAM"
            }
        ]
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(cfg.bitrix_webhook_url, json=payload, timeout=10) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("result"):
                        print(f"✓ Bitrix24: создан лид ID {result['result']} для user {user_id}")
                        return True
                    else:
                        print(f"✗ Bitrix24: ошибка создания лида - {result.get('error_description', 'Unknown error')}")
                        return False
                else:
                    print(f"✗ Bitrix24: HTTP {response.status}")
                    return False
    except asyncio.TimeoutError:
        print("✗ Bitrix24: timeout")
        return False
    except Exception as e:
        print(f"✗ Bitrix24: {e}")
        return False


def kb_main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🏥 О клинике", callback_data="menu:about")],
            [InlineKeyboardButton(text="🧾 Услуги", callback_data="menu:services")],
            [InlineKeyboardButton(text="👨‍⚕️ Вызвать доктора", callback_data="menu:call_doctor")],
            [InlineKeyboardButton(text="🗓 Записаться на приём", callback_data="menu:appointment")],
            [InlineKeyboardButton(text="💬 Задать вопрос администратору", callback_data="menu:admin_question")],
            [InlineKeyboardButton(text="❓ Частые вопросы (FAQ)", callback_data="menu:faq")],
        ]
    )


def kb_welcome_quick() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🧾 Услуги", callback_data="menu:services")],
            [InlineKeyboardButton(text="👨‍⚕️ Вызвать доктора", callback_data="menu:call_doctor")],
            [InlineKeyboardButton(text="🗓 Записаться", callback_data="menu:appointment")],
            [InlineKeyboardButton(text="💬 Вопрос администратору", callback_data="menu:admin_question")],
        ]
    )


def kb_back_to_main() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="⬅️ В меню", callback_data="nav:main")]]
    )


def kb_about_cta() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=TEXTS["cta_admin"], callback_data="menu:admin_question")],
            [InlineKeyboardButton(text="Перейти к услугам", callback_data="menu:services")],
            [InlineKeyboardButton(text="⬅️ В меню", callback_data="nav:main")],
        ]
    )


def kb_services_list() -> InlineKeyboardMarkup:
    items = TEXTS["services"]["items"]
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=items["detox"]["name"], callback_data="svc:detox")],
            [InlineKeyboardButton(text=items["iv"]["name"], callback_data="svc:iv")],
            [InlineKeyboardButton(text=items["rehab"]["name"], callback_data="svc:rehab")],
            [InlineKeyboardButton(text=items["consult"]["name"], callback_data="svc:consult")],
            [InlineKeyboardButton(text=items["family"]["name"], callback_data="svc:family")],
            [InlineKeyboardButton(text="⬅️ В меню", callback_data="nav:main")],
        ]
    )


def kb_service_card() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Уточнить у администратора", callback_data="menu:admin_question")],
            [InlineKeyboardButton(text="👨‍⚕️ Вызвать доктора", callback_data="menu:call_doctor")],
            [InlineKeyboardButton(text="⬅️ Назад к услугам", callback_data="menu:services")],
        ]
    )


def kb_faq_list() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ В меню", callback_data="nav:main")],
        ]
    )


def kb_faq_item_controls() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=TEXTS["cta_admin"], callback_data="menu:admin_question")],
            [InlineKeyboardButton(text="⬅️ К FAQ", callback_data="menu:faq")],
        ]
    )


def kb_call_doctor_types() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Запой", callback_data="call:zapoy")],
            [InlineKeyboardButton(text="Похмелье / интоксикация", callback_data="call:intox")],
            [InlineKeyboardButton(text="Тревога / паника", callback_data="call:panic")],
            [InlineKeyboardButton(text="Агрессия", callback_data="call:aggr")],
            [InlineKeyboardButton(text="Другое", callback_data="call:other")],
            [InlineKeyboardButton(text="⬅️ В меню", callback_data="nav:main")],
        ]
    )


def kb_appointment_types() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Консультация", callback_data="appt:consult")],
            [InlineKeyboardButton(text="Осмотр", callback_data="appt:exam")],
            [InlineKeyboardButton(text="Реабилитация", callback_data="appt:rehab")],
            [InlineKeyboardButton(text="⬅️ В меню", callback_data="nav:main")],
        ]
    )


def kb_admin_topics() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Стоимость", callback_data="adm:price")],
            [InlineKeyboardButton(text="Анонимность", callback_data="adm:anon")],
            [InlineKeyboardButton(text="Как проходит лечение", callback_data="adm:process")],
            [InlineKeyboardButton(text="Реабилитация", callback_data="adm:rehab")],
            [InlineKeyboardButton(text="Другое", callback_data="adm:other")],
            [InlineKeyboardButton(text="⬅️ В меню", callback_data="nav:main")],
        ]
    )


def user_display(message: Message) -> str:
    u = message.from_user
    if not u:
        return "(unknown user)"
    username = f"@{u.username}" if u.username else "(no username)"
    return f"{username} | id:{u.id}"


async def notify_admins(bot: Bot, cfg: Config, text: str) -> None:
    for chat_id in cfg.admin_chat_ids:
        await bot.send_message(chat_id=chat_id, text=text)


async def handoff_user(message: Message, state: FSMContext) -> None:
    await state.clear()
    if message.from_user:
        await ensure_user(message.from_user.id, message.from_user.username, message.from_user.first_name, message.from_user.last_name)
        await set_handoff(message.from_user.id, True)


async def cmd_start(message: Message, state: FSMContext) -> None:
    await state.clear()
    if message.from_user:
        await ensure_user(message.from_user.id, message.from_user.username, message.from_user.first_name, message.from_user.last_name)
        await set_handoff(message.from_user.id, False)

    welcome_text = f"{TEXTS['welcome']}\n\n{TEXTS['main_menu_title']}"
    await message.answer(welcome_text, reply_markup=kb_main_menu())


async def nav_main(call: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    if call.from_user:
        await ensure_user(call.from_user.id, call.from_user.username, call.from_user.first_name, call.from_user.last_name)
        await set_handoff(call.from_user.id, False)
    await call.message.edit_text(TEXTS["main_menu_title"], reply_markup=kb_main_menu())
    await call.answer()


async def menu_about(call: CallbackQuery) -> None:
    about = TEXTS["about"]
    await call.message.edit_text(about["text"], reply_markup=kb_about_cta())
    await call.answer()


async def menu_services(call: CallbackQuery) -> None:
    await call.message.edit_text(TEXTS["services"]["title"], reply_markup=kb_services_list())
    await call.answer()


def render_service_card(service_key: str) -> str:
    svc = TEXTS["services"]["items"][service_key]
    steps = "\n".join([f"{i+1}. {s}" for i, s in enumerate(svc["steps"])])
    return (
        f"{svc['name']}\n\n"
        f"Кратко: {svc['short']}\n\n"
        f"Когда подходит: {svc['when']}\n\n"
        f"Как проходит:\n{steps}\n\n"
        f"Сколько длится: {svc['duration']}\n"
        f"Стоимость: {svc['price']}\n\n"
        f"{TEXTS['critical']}"
    )


async def menu_service_card(call: CallbackQuery) -> None:
    _, key = call.data.split(":", 1)
    await call.message.edit_text(render_service_card(key), reply_markup=kb_service_card())
    await call.answer()


async def menu_faq(call: CallbackQuery) -> None:
    items = TEXTS["faq"]["items"]
    text_lines = [TEXTS["faq"]["title"], ""]
    for i, item in enumerate(items, start=1):
        text_lines.append(f"{i}. {item['q']}")
    text_lines.append("\nОтправьте номер вопроса одним сообщением, чтобы увидеть ответ.")
    await call.message.edit_text("\n".join(text_lines), reply_markup=kb_faq_list())
    await call.answer()


async def menu_call_doctor(call: CallbackQuery, state: FSMContext) -> None:
    await state.set_state(HandoffState.waiting_call_doctor_type)
    await call.message.edit_text(
        "👨‍⚕️ <b>Вызов доктора</b>\n\nОпишите, что происходит сейчас. Коротко.\n\nВыберите вариант:",
        reply_markup=kb_call_doctor_types(),
    )
    await call.answer()


async def call_doctor_type_selected(call: CallbackQuery, state: FSMContext) -> None:
    _, t = call.data.split(":", 1)
    await state.update_data(call_doctor_type=t)

    if t == "other":
        await state.set_state(HandoffState.waiting_call_doctor_other_text)
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="nav:main")]]
        )
        await call.message.edit_text(
            "📝 Напишите одним сообщением, что происходит. Коротко.",
            reply_markup=cancel_kb
        )
        await call.answer()
        return

    back_to_menu_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="nav:main")]]
    )
    await call.message.edit_text(
        "✅ Спасибо. Передал информацию администратору.\n\n"
        "Скоро с вами свяжутся.\n\n"
        "⚠️ Если есть угроза жизни — вызывайте скорую помощь (112/103).",
        reply_markup=back_to_menu_kb
    )
    await call.answer()

    data = await state.get_data()
    cfg = load_config()
    user = call.from_user
    username = f"@{user.username}" if user and user.username else "(no username)"

    type_map = {
        "zapoy": "Запой",
        "intox": "Похмелье / интоксикация",
        "panic": "Тревога / паника",
        "aggr": "Агрессия",
    }
    scenario = "Вызвать доктора"
    brief = type_map.get(t, t)
    text = (
        f"Новая заявка\n"
        f"Клиент: {username} | id:{user.id if user else 'unknown'}\n"
        f"Сценарий: {scenario}\n"
        f"Описание: {brief}"
    )
    if call.from_user:
        await ensure_user(call.from_user.id, call.from_user.username, call.from_user.first_name, call.from_user.last_name)
        request_id = await save_request_with_id(call.from_user.id, scenario, brief, brief)
        text_with_id = f"{text}\n\n[ID заявки: {request_id}]"
        await notify_admins(call.bot, cfg, text_with_id)
        
        # Создаём лид в Bitrix24
        await create_bitrix_lead(
            user_id=call.from_user.id,
            username=call.from_user.username,
            first_name=call.from_user.first_name,
            scenario=scenario,
            topic=brief,
            description=brief
        )
        
        await set_handoff(call.from_user.id, True)
    await state.clear()


async def call_doctor_other_text(message: Message, state: FSMContext) -> None:
    text_user = (message.text or "").strip()
    if not text_user:
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="nav:main")]]
        )
        await message.answer(
            "Напишите одним сообщением, что происходит. Коротко.",
            reply_markup=cancel_kb
        )
        return

    back_to_menu_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="nav:main")]]
    )
    await message.answer(
        "✅ Спасибо. Передал информацию администратору.\n\n"
        "Скоро с вами свяжутся.\n\n"
        "⚠️ Если есть угроза жизни — вызывайте скорую помощь (112/103).",
        reply_markup=back_to_menu_kb
    )

    cfg = load_config()
    scenario = "Вызвать доктора"
    payload = (
        f"Новая заявка\n"
        f"Клиент: {user_display(message)}\n"
        f"Сценарий: {scenario}\n"
        f"Описание: Другое — {text_user}"
    )
    if message.from_user:
        request_id = await save_request_with_id(message.from_user.id, scenario, "Другое", text_user)
        payload_with_id = f"{payload}\n\n[ID заявки: {request_id}]"
        await notify_admins(message.bot, cfg, payload_with_id)
        
        # Создаём лид в Bitrix24
        await create_bitrix_lead(
            user_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            scenario=scenario,
            topic="Другое",
            description=text_user
        )
    await handoff_user(message, state)


async def menu_appointment(call: CallbackQuery, state: FSMContext) -> None:
    await state.set_state(HandoffState.waiting_appointment_type)
    await call.message.edit_text(
        "🗓 <b>Запись на приём</b>\n\nВыберите тип записи:",
        reply_markup=kb_appointment_types()
    )
    await call.answer()


async def appointment_type_selected(call: CallbackQuery, state: FSMContext) -> None:
    _, t = call.data.split(":", 1)
    await state.update_data(appointment_type=t)
    await state.set_state(HandoffState.waiting_appointment_text)
    cancel_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="nav:main")]]
    )
    await call.message.edit_text(
        "📝 Коротко опишите запрос (одно сообщение).",
        reply_markup=cancel_kb
    )
    await call.answer()


async def appointment_text(message: Message, state: FSMContext) -> None:
    text_user = (message.text or "").strip()
    if not text_user:
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="nav:main")]]
        )
        await message.answer(
            "Коротко опишите запрос (одно сообщение).",
            reply_markup=cancel_kb
        )
        return

    data = await state.get_data()
    t = data.get("appointment_type")
    t_map = {"consult": "Консультация", "exam": "Осмотр", "rehab": "Реабилитация"}

    back_to_menu_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="nav:main")]]
    )
    await message.answer(
        "✅ Спасибо. Передал информацию администратору.\n\n"
        "Скоро с вами свяжутся.",
        reply_markup=back_to_menu_kb
    )

    cfg = load_config()
    payload = (
        f"Новая заявка\n"
        f"Клиент: {user_display(message)}\n"
        f"Сценарий: Записаться на приём\n"
        f"Тип: {t_map.get(t, t)}\n"
        f"Описание: {text_user}"
    )
    if message.from_user:
        request_id = await save_request_with_id(message.from_user.id, "Записаться на приём", t_map.get(t, t), text_user)
        payload_with_id = f"{payload}\n\n[ID заявки: {request_id}]"
        await notify_admins(message.bot, cfg, payload_with_id)
        
        # Создаём лид в Bitrix24
        await create_bitrix_lead(
            user_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            scenario="Записаться на приём",
            topic=t_map.get(t, t),
            description=text_user
        )
    await handoff_user(message, state)


async def menu_admin_question(call: CallbackQuery, state: FSMContext) -> None:
    await state.set_state(HandoffState.waiting_admin_topic)
    await call.message.edit_text(
        "💬 <b>Вопрос администратору</b>\n\nВыберите тему вопроса:",
        reply_markup=kb_admin_topics()
    )
    await call.answer()


async def admin_topic_selected(call: CallbackQuery, state: FSMContext) -> None:
    _, t = call.data.split(":", 1)
    await state.update_data(admin_topic=t)
    await state.set_state(HandoffState.waiting_admin_text)
    cancel_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="nav:main")]]
    )
    await call.message.edit_text(
        "📝 Напишите вопрос одним сообщением.",
        reply_markup=cancel_kb
    )
    await call.answer()


async def admin_text(message: Message, state: FSMContext) -> None:
    text_user = (message.text or "").strip()
    if not text_user:
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="nav:main")]]
        )
        await message.answer(
            "Напишите вопрос одним сообщением.",
            reply_markup=cancel_kb
        )
        return

    data = await state.get_data()
    t = data.get("admin_topic")
    t_map = {
        "price": "Стоимость",
        "anon": "Анонимность",
        "process": "Как проходит лечение",
        "rehab": "Реабилитация",
        "other": "Другое",
    }

    back_to_menu_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="nav:main")]]
    )
    await message.answer(
        "✅ Спасибо. Передал вопрос администратору.\n\n"
        "Скоро с вами свяжутся.",
        reply_markup=back_to_menu_kb
    )

    cfg = load_config()
    payload = (
        f"Новая заявка\n"
        f"Клиент: {user_display(message)}\n"
        f"Сценарий: Вопрос администратратору\n"
        f"Тема: {t_map.get(t, t)}\n"
        f"Описание: {text_user}"
    )
    if message.from_user:
        request_id = await save_request_with_id(message.from_user.id, "Вопрос администратору", t_map.get(t, t), text_user)
        payload_with_id = f"{payload}\n\n[ID заявки: {request_id}]"
        await notify_admins(message.bot, cfg, payload_with_id)
        
        # Создаём лид в Bitrix24
        await create_bitrix_lead(
            user_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            scenario="Вопрос администратору",
            topic=t_map.get(t, t),
            description=text_user
        )
    await handoff_user(message, state)


async def faq_number_message(message: Message) -> bool:
    text = (message.text or "").strip()
    if not text.isdigit():
        return False

    idx = int(text)
    items = TEXTS["faq"]["items"]
    if idx < 1 or idx > len(items):
        return False

    item = items[idx - 1]
    await message.answer(f"{item['q']}\n\n{item['a']}", reply_markup=kb_faq_item_controls())
    return True


async def ignore_when_handoff(message: Message) -> None:
    if message.from_user and await is_user_in_handoff(message.from_user.id):
        return


async def admin_reply_handler(message: Message) -> None:
    cfg = load_config()
    if not message.from_user or message.from_user.id not in cfg.admin_chat_ids:
        return
    
    if not message.reply_to_message or not message.reply_to_message.text:
        return
    
    replied_text = message.reply_to_message.text
    import re
    match = re.search(r"\[ID заявки: (\d+)\]", replied_text)
    if not match:
        return
    
    request_id = int(match.group(1))
    user_id = await get_user_id_from_request(request_id)
    
    if not user_id:
        await message.answer("❌ Не удалось найти пользователя для этой заявки.")
        return
    
    admin_response = message.text or ""
    try:
        await message.bot.send_message(
            chat_id=user_id,
            text=f"💬 Ответ от администратора:\n\n{admin_response}"
        )
        await message.answer("✅ Ответ отправлен пользователю")
    except Exception as e:
        await message.answer(f"❌ Ошибка отправки: {e}")


async def cmd_stats(message: Message) -> None:
    cfg = load_config()
    if not message.from_user or message.from_user.id not in cfg.admin_chat_ids:
        return
    
    async with DB_POOL.acquire() as conn:
        total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
        total_requests = await conn.fetchval("SELECT COUNT(*) FROM requests")
        today_requests = await conn.fetchval(
            "SELECT COUNT(*) FROM requests WHERE DATE(created_at) = CURRENT_DATE"
        )
        handoff_count = await conn.fetchval(
            "SELECT COUNT(*) FROM handoff_state WHERE is_handoff = TRUE"
        )
        
        recent = await conn.fetch(
            "SELECT scenario, COUNT(*) as cnt FROM requests GROUP BY scenario ORDER BY cnt DESC LIMIT 5"
        )
    
    stats_text = (
        f"📊 Статистика бота\n\n"
        f"👥 Всего пользователей: {total_users}\n"
        f"📝 Всего заявок: {total_requests}\n"
        f"📅 Заявок сегодня: {today_requests}\n"
        f"🔄 В режиме handoff: {handoff_count}\n\n"
        f"📈 Популярные сценарии:\n"
    )
    
    for row in recent:
        stats_text += f"  • {row['scenario']}: {row['cnt']}\n"
    
    await message.answer(stats_text)


async def cmd_help_admin(message: Message) -> None:
    cfg = load_config()
    if not message.from_user or message.from_user.id not in cfg.admin_chat_ids:
        return
    
    help_text = (
        "🔧 Команды администратора\n\n"
        "/stats — статистика заявок и пользователей\n"
        "/help_admin — это сообщение\n\n"
        "💬 Как отвечать на заявки:\n"
        "1. Когда приходит заявка, в ней есть [ID заявки: XXX]\n"
        "2. Ответьте REPLY на это сообщение\n"
        "3. Ваш ответ автоматически отправится пользователю\n\n"
        "⚠️ После отправки заявки пользователь в режиме handoff — бот не отвечает ему, пока он не нажмёт /start"
    )
    
    await message.answer(help_text)


async def cmd_admin(message: Message) -> None:
    cfg = load_config()
    if not message.from_user or message.from_user.id not in cfg.admin_chat_ids:
        return
    
    admin_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="📊 Статистика", callback_data="admin:stats")],
            [InlineKeyboardButton(text="📋 Активные заявки", callback_data="admin:active")],
            [InlineKeyboardButton(text="📥 Экспорт данных (CSV)", callback_data="admin:export_csv")],
            [InlineKeyboardButton(text="✏️ Редактировать тексты", callback_data="admin:edit_texts")],
            [InlineKeyboardButton(text="👥 Управление админами", callback_data="admin:manage_admins")],
            [InlineKeyboardButton(text="⚙️ Настройки бота", callback_data="admin:settings")],
            [InlineKeyboardButton(text="❓ Помощь", callback_data="admin:help")],
            [InlineKeyboardButton(text="👤 Выйти в пользовательский режим", callback_data="nav:main")],
        ]
    )
    
    await message.answer(
        "🔧 <b>Админ-панель</b>\n\n"
        "Выберите действие:",
        reply_markup=admin_kb
    )


async def admin_panel_callback(call: CallbackQuery, state: FSMContext) -> None:
    cfg = load_config()
    if not call.from_user or call.from_user.id not in cfg.admin_chat_ids:
        await call.answer("❌ Доступ запрещён")
        return
    
    action = call.data.split(":")[1]
    
    if action == "stats":
        async with DB_POOL.acquire() as conn:
            total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
            total_requests = await conn.fetchval("SELECT COUNT(*) FROM requests")
            today_requests = await conn.fetchval(
                "SELECT COUNT(*) FROM requests WHERE DATE(created_at) = CURRENT_DATE"
            )
            handoff_count = await conn.fetchval(
                "SELECT COUNT(*) FROM handoff_state WHERE is_handoff = TRUE"
            )
            recent = await conn.fetch(
                "SELECT scenario, COUNT(*) as cnt FROM requests GROUP BY scenario ORDER BY cnt DESC LIMIT 5"
            )
        
        stats_text = (
            "📊 <b>Статистика бота</b>\n\n"
            f"👥 Всего пользователей: <b>{total_users}</b>\n"
            f"📝 Всего заявок: <b>{total_requests}</b>\n"
            f"📅 Заявок сегодня: <b>{today_requests}</b>\n"
            f"🔄 В режиме handoff: <b>{handoff_count}</b>\n\n"
            "📈 <b>Популярные сценарии:</b>\n"
        )
        for row in recent:
            stats_text += f"  • {row['scenario']}: {row['cnt']}\n"
        
        back_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")]]
        )
        await call.message.edit_text(stats_text, reply_markup=back_kb)
    
    elif action == "active":
        async with DB_POOL.acquire() as conn:
            active = await conn.fetch(
                "SELECT r.id, r.scenario, r.topic, r.created_at, u.username "
                "FROM requests r JOIN users u ON r.user_id = u.user_id "
                "WHERE r.status = 'new' ORDER BY r.created_at DESC LIMIT 10"
            )
        
        if not active:
            text = "📋 <b>Активные заявки</b>\n\nНет активных заявок"
        else:
            text = "📋 <b>Активные заявки</b> (последние 10)\n\n"
            for row in active:
                username = f"@{row['username']}" if row['username'] else "(без username)"
                created = row['created_at'].strftime("%d.%m %H:%M")
                text += f"#{row['id']} | {username}\n{row['scenario']} - {row['topic']}\n{created}\n\n"
        
        back_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")]]
        )
        await call.message.edit_text(text, reply_markup=back_kb)
    
    elif action == "export_csv":
        await call.answer("⏳ Генерирую CSV файл...")
        
        import csv
        import io
        from datetime import datetime
        
        async with DB_POOL.acquire() as conn:
            users = await conn.fetch(
                "SELECT u.user_id, u.username, u.first_name, u.last_name, u.created_at, "
                "COUNT(r.id) as requests_count "
                "FROM users u LEFT JOIN requests r ON u.user_id = r.user_id "
                "GROUP BY u.user_id, u.username, u.first_name, u.last_name, u.created_at "
                "ORDER BY u.created_at DESC"
            )
            
            requests = await conn.fetch(
                "SELECT r.id, r.user_id, u.username, r.scenario, r.topic, r.description, "
                "r.created_at, r.status "
                "FROM requests r JOIN users u ON r.user_id = u.user_id "
                "ORDER BY r.created_at DESC"
            )
        
        # Создаём CSV для пользователей
        users_csv = io.StringIO()
        users_writer = csv.writer(users_csv)
        users_writer.writerow(['User ID', 'Username', 'First Name', 'Last Name', 'Created At', 'Requests Count'])
        for user in users:
            users_writer.writerow([
                user['user_id'],
                user['username'] or '',
                user['first_name'] or '',
                user['last_name'] or '',
                user['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                user['requests_count']
            ])
        
        # Создаём CSV для заявок
        requests_csv = io.StringIO()
        requests_writer = csv.writer(requests_csv)
        requests_writer.writerow(['Request ID', 'User ID', 'Username', 'Scenario', 'Topic', 'Description', 'Created At', 'Status'])
        for req in requests:
            requests_writer.writerow([
                req['id'],
                req['user_id'],
                req['username'] or '',
                req['scenario'],
                req['topic'] or '',
                req['description'],
                req['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                req['status']
            ])
        
        # Отправляем файлы
        from aiogram.types import BufferedInputFile
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        users_file = BufferedInputFile(
            users_csv.getvalue().encode('utf-8-sig'),
            filename=f'users_{timestamp}.csv'
        )
        
        requests_file = BufferedInputFile(
            requests_csv.getvalue().encode('utf-8-sig'),
            filename=f'requests_{timestamp}.csv'
        )
        
        await call.message.answer_document(
            users_file,
            caption=f"📊 <b>Экспорт пользователей</b>\n\nВсего пользователей: {len(users)}"
        )
        
        await call.message.answer_document(
            requests_file,
            caption=f"📋 <b>Экспорт заявок</b>\n\nВсего заявок: {len(requests)}"
        )
        
        back_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")]]
        )
        await call.message.answer(
            "✅ <b>Экспорт завершён!</b>\n\n"
            "Файлы отправлены выше.",
            reply_markup=back_kb
        )
    
    elif action == "handoff":
        async with DB_POOL.acquire() as conn:
            handoff_users = await conn.fetch(
                "SELECT u.user_id, u.username, h.handoff_at "
                "FROM handoff_state h JOIN users u ON h.user_id = u.user_id "
                "WHERE h.is_handoff = TRUE ORDER BY h.handoff_at DESC"
            )
        
        if not handoff_users:
            text = "👥 <b>Пользователи в handoff</b>\n\nНет пользователей в режиме handoff"
        else:
            text = f"👥 <b>Пользователи в handoff</b> ({len(handoff_users)})\n\n"
            for row in handoff_users:
                username = f"@{row['username']}" if row['username'] else f"ID: {row['user_id']}"
                handoff_at = row['handoff_at'].strftime("%d.%m %H:%M")
                text += f"• {username} (с {handoff_at})\n"
        
        back_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")]]
        )
        await call.message.edit_text(text, reply_markup=back_kb)
    
    elif action == "recent":
        async with DB_POOL.acquire() as conn:
            recent = await conn.fetch(
                "SELECT r.id, r.scenario, r.description, r.created_at, u.username "
                "FROM requests r JOIN users u ON r.user_id = u.user_id "
                "ORDER BY r.created_at DESC LIMIT 5"
            )
        
        text = "📝 <b>Последние 5 заявок</b>\n\n"
        for row in recent:
            username = f"@{row['username']}" if row['username'] else "(без username)"
            created = row['created_at'].strftime("%d.%m %H:%M")
            desc = row['description'][:50] + "..." if len(row['description']) > 50 else row['description']
            text += f"#{row['id']} | {username}\n{row['scenario']}\n{desc}\n{created}\n\n"
        
        back_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")]]
        )
        await call.message.edit_text(text, reply_markup=back_kb)
    
    elif action == "help":
        help_text = (
            "❓ <b>Помощь администратора</b>\n\n"
            "<b>Как отвечать на заявки:</b>\n"
            "1. Когда приходит заявка, в ней есть [ID заявки: XXX]\n"
            "2. Ответьте REPLY на это сообщение\n"
            "3. Ваш ответ автоматически отправится пользователю\n\n"
            "<b>Команды:</b>\n"
            "/admin — эта панель\n"
            "/stats — быстрая статистика\n"
            "/help_admin — подробная помощь\n\n"
            "<b>Режим handoff:</b>\n"
            "После отправки заявки пользователь в режиме handoff — бот не отвечает ему, пока он не нажмёт /start"
        )
        back_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")]]
        )
        await call.message.edit_text(help_text, reply_markup=back_kb)
    
    elif action == "edit_texts":
        edit_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="📝 Приветствие", callback_data="edit:welcome")],
                [InlineKeyboardButton(text="🏥 О клинике", callback_data="edit:about")],
                [InlineKeyboardButton(text="⚠️ Критическое сообщение", callback_data="edit:critical")],
                [InlineKeyboardButton(text="🧾 Услуги", callback_data="edit:services")],
                [InlineKeyboardButton(text="❓ FAQ", callback_data="edit:faq")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")],
            ]
        )
        await call.message.edit_text(
            "✏️ <b>Редактирование текстов</b>\n\n"
            "Выберите раздел для редактирования:",
            reply_markup=edit_kb
        )
    
    elif action == "manage_admins":
        admins = admin_panel.get_admin_ids()
        admin_list = "\n".join([f"• ID: <code>{aid}</code>" for aid in admins])
        
        manage_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="➕ Добавить админа", callback_data="admin:add_admin")],
                [InlineKeyboardButton(text="➖ Удалить админа", callback_data="admin:remove_admin")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")],
            ]
        )
        await call.message.edit_text(
            f"👥 <b>Управление администраторами</b>\n\n"
            f"<b>Текущие админы:</b>\n{admin_list}\n\n"
            f"Всего: {len(admins)}",
            reply_markup=manage_kb
        )
    
    elif action == "settings":
        settings = admin_panel.get_current_settings()
        
        settings_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="🔗 Изменить Bitrix24 webhook", callback_data="admin:edit_bitrix")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:back")],
            ]
        )
        
        bitrix_status = "✅ Настроен" if settings["bitrix_webhook"] != "Не настроен" else "❌ Не настроен"
        
        await call.message.edit_text(
            f"⚙️ <b>Настройки бота</b>\n\n"
            f"<b>База данных:</b>\n"
            f"• Имя: {settings['db_name']}\n"
            f"• Хост: {settings['db_host']}\n\n"
            f"<b>Bitrix24 CRM:</b>\n"
            f"• Статус: {bitrix_status}\n\n"
            f"<b>Администраторов:</b> {len(settings['admin_ids'])}",
            reply_markup=settings_kb
        )
    
    elif action == "add_admin":
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:manage_admins")]]
        )
        await call.message.edit_text(
            "➕ <b>Добавление администратора</b>\n\n"
            "Отправьте Telegram ID или @username нового администратора одним сообщением.\n\n"
            "Примеры:\n"
            "• <code>123456789</code> (ID)\n"
            "• <code>@username</code> (username)",
            reply_markup=cancel_kb
        )
        await state.set_state(admin_handlers.AdminEditState.adding_admin)
        await call.answer()
        return
    
    elif action == "remove_admin":
        admins = admin_panel.get_admin_ids()
        if len(admins) == 1:
            await call.answer("❌ Нельзя удалить последнего админа!", show_alert=True)
            return
        
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:manage_admins")]]
        )
        await call.message.edit_text(
            "➖ <b>Удаление администратора</b>\n\n"
            "Отправьте Telegram ID администратора для удаления.\n\n"
            "Пример: <code>123456789</code>",
            reply_markup=cancel_kb
        )
        await state.set_state(admin_handlers.AdminEditState.removing_admin)
        await call.answer()
        return
    
    elif action == "edit_bitrix":
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:settings")]]
        )
        await call.message.edit_text(
            "🔗 <b>Изменение Bitrix24 webhook</b>\n\n"
            "Отправьте новый URL вебхука для Bitrix24 CRM.\n\n"
            "Формат:\n"
            "<code>https://your-domain.bitrix24.ru/rest/1/xxx/crm.lead.add.json</code>",
            reply_markup=cancel_kb
        )
        await state.set_state(admin_handlers.AdminEditState.editing_bitrix_webhook)
        await call.answer()
        return
    
    elif action == "back":
        admin_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="📊 Статистика", callback_data="admin:stats")],
                [InlineKeyboardButton(text="📋 Активные заявки", callback_data="admin:active")],
                [InlineKeyboardButton(text="📥 Экспорт данных (CSV)", callback_data="admin:export_csv")],
                [InlineKeyboardButton(text="✏️ Редактировать тексты", callback_data="admin:edit_texts")],
                [InlineKeyboardButton(text="👥 Управление админами", callback_data="admin:manage_admins")],
                [InlineKeyboardButton(text="⚙️ Настройки бота", callback_data="admin:settings")],
                [InlineKeyboardButton(text="❓ Помощь", callback_data="admin:help")],
                [InlineKeyboardButton(text="👤 Выйти в пользовательский режим", callback_data="nav:main")],
            ]
        )
        await call.message.edit_text(
            "🔧 <b>Админ-панель</b>\n\n"
            "Выберите действие:",
            reply_markup=admin_kb
        )
    
    await call.answer()


async def fallback_text_router(message: Message, state: FSMContext) -> None:
    if message.from_user and await is_user_in_handoff(message.from_user.id):
        return
    
    # Сначала проверяем FAQ (для обычных пользователей)
    handled = await faq_number_message(message)
    if handled:
        return
    
    # Потом проверяем ответы админа
    cfg = load_config()
    if message.from_user and message.from_user.id in cfg.admin_chat_ids:
        await admin_reply_handler(message)
        return

    await message.answer(TEXTS["main_menu_title"], reply_markup=kb_main_menu())


async def main() -> None:
    global DB_POOL
    
    cfg = load_config()
    
    DB_POOL = await init_db_pool(cfg)
    print(f"✓ БД подключена: {cfg.db_name}@{cfg.db_host}:{cfg.db_port}")
    
    bot = Bot(token=cfg.bot_token, parse_mode=ParseMode.HTML)
    dp = Dispatcher()

    dp.message.register(cmd_start, Command("start"))
    dp.message.register(cmd_stats, Command("stats"))
    dp.message.register(cmd_help_admin, Command("help_admin"))
    dp.message.register(cmd_admin, Command("admin"))

    dp.callback_query.register(nav_main, F.data == "nav:main")
    dp.callback_query.register(admin_panel_callback, F.data.startswith("admin:"))
    
    # Регистрация обработчиков редактирования текстов
    dp.callback_query.register(admin_handlers.cancel_edit_callback, F.data == "cancel_edit")
    dp.callback_query.register(admin_handlers.edit_text_callback, F.data.startswith("edit:"))
    dp.callback_query.register(admin_handlers.edit_service_callback, F.data.startswith("edit_svc:"))
    dp.callback_query.register(admin_handlers.edit_service_field_callback, F.data.startswith("edit_svc_field:"))
    dp.callback_query.register(admin_handlers.edit_faq_callback, F.data.startswith("edit_faq:"))
    
    # Регистрация обработчика для текстовых сообщений в режиме редактирования
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.editing_welcome)
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.editing_about)
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.editing_critical)
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.editing_service)
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.editing_faq_question)
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.adding_admin)
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.removing_admin)
    dp.message.register(admin_handlers.handle_text_edit, admin_handlers.AdminEditState.editing_bitrix_webhook)

    dp.callback_query.register(menu_about, F.data == "menu:about")
    dp.callback_query.register(menu_services, F.data == "menu:services")
    dp.callback_query.register(menu_faq, F.data == "menu:faq")

    dp.callback_query.register(menu_call_doctor, F.data == "menu:call_doctor")
    dp.callback_query.register(call_doctor_type_selected, HandoffState.waiting_call_doctor_type, F.data.startswith("call:"))
    dp.message.register(call_doctor_other_text, HandoffState.waiting_call_doctor_other_text)

    dp.callback_query.register(menu_appointment, F.data == "menu:appointment")
    dp.callback_query.register(appointment_type_selected, HandoffState.waiting_appointment_type, F.data.startswith("appt:"))
    dp.message.register(appointment_text, HandoffState.waiting_appointment_text)

    dp.callback_query.register(menu_admin_question, F.data == "menu:admin_question")
    dp.callback_query.register(admin_topic_selected, HandoffState.waiting_admin_topic, F.data.startswith("adm:"))
    dp.message.register(admin_text, HandoffState.waiting_admin_text)

    dp.callback_query.register(menu_service_card, F.data.startswith("svc:"))

    dp.message.register(fallback_text_router)

    print("✓ Бот запущен")
    try:
        await dp.start_polling(bot)
    finally:
        await DB_POOL.close()
        print("✓ БД отключена")


if __name__ == "__main__":
    asyncio.run(main())
