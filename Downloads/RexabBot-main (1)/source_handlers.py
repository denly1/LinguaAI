"""
Обработчики для управления источниками (QR/ссылки) в админ-панели
"""
from aiogram.types import CallbackQuery, Message, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import qrcode
from io import BytesIO
from aiogram.types import BufferedInputFile

import admin_handlers
from bot import (
    list_sources,
    create_source,
    update_source_title,
    update_source_description,
    delete_source,
    get_source_by_code,
    get_bot_username,
)


class SourceState(StatesGroup):
    adding_title = State()
    adding_code = State()
    adding_desc = State()
    editing_title = State()
    editing_desc = State()


async def source_callback(call: CallbackQuery, state: FSMContext) -> None:
    """Обработка коллбэков для источников"""
    parts = call.data.split(":")
    action = parts[1]

    if action == "add":
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:sources")]]
        )
        await call.message.edit_text(
            "➕ <b>Создание источника</b>\n\n"
            "Отправьте название источника одним сообщением.\n\n"
            "Пример: <code>Реклама в Instagram</code>",
            reply_markup=cancel_kb
        )
        await state.set_state(SourceState.adding_title)
        await call.answer()
        return

    elif action == "edit":
        source_code = parts[2]
        source = await get_source_by_code(source_code)
        if not source:
            await call.answer("❌ Источник не найден", show_alert=True)
            return

        text = (
            f"📎 <b>Источник: {source['title']}</b>\n\n"
            f"<b>Код:</b> <code>{source['code']}</code>\n"
            f"<b>Описание:</b> {source['description'] or '(нет)'}\n\n"
            f"Выберите действие:"
        )
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="✏️ Название", callback_data=f"source:edit_title:{source_code}")],
                [InlineKeyboardButton(text="✏️ Описание", callback_data=f"source:edit_desc:{source_code}")],
                [InlineKeyboardButton(text="🔗 Ссылка", callback_data=f"source:link:{source_code}")],
                [InlineKeyboardButton(text="📱 QR-код", callback_data=f"source:qr:{source_code}")],
                [InlineKeyboardButton(text="🗑️ Удалить", callback_data=f"source:delete:{source_code}")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:sources")],
            ]
        )
        await call.message.edit_text(text, reply_markup=kb)
        await call.answer()
        return

    elif action == "edit_title":
        source_code = parts[2]
        source = await get_source_by_code(source_code)
        if not source:
            await call.answer("❌ Источник не найден", show_alert=True)
            return

        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data=f"source:edit:{source_code}")]]
        )
        await call.message.edit_text(
            f"✏️ <b>Редактирование названия</b>\n\n"
            f"<b>Текущее название:</b> {source['title']}\n\n"
            f"Отправьте новое название одним сообщением:",
            reply_markup=cancel_kb
        )
        await state.set_state(SourceState.editing_title)
        await state.update_data(source_code=source_code)
        await call.answer()
        return

    elif action == "edit_desc":
        source_code = parts[2]
        source = await get_source_by_code(source_code)
        if not source:
            await call.answer("❌ Источник не найден", show_alert=True)
            return

        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data=f"source:edit:{source_code}")]]
        )
        await call.message.edit_text(
            f"✏️ <b>Редактирование описания</b>\n\n"
            f"<b>Текущее описание:</b> {source['description'] or '(нет)'}\n\n"
            f"Отправьте новое описание одним сообщением (или отправьте точку '.' чтобы удалить):",
            reply_markup=cancel_kb
        )
        await state.set_state(SourceState.editing_desc)
        await state.update_data(source_code=source_code)
        await call.answer()
        return

    elif action == "link":
        source_code = parts[2]
        bot_username = await get_bot_username(call.bot)
        if not bot_username:
            await call.answer("❌ Не удалось получить username бота", show_alert=True)
            return

        link = f"https://t.me/{bot_username}?start={source_code}"
        text = (
            f"🔗 <b>Ссылка для источника</b>\n\n"
            f"<b>Код:</b> <code>{source_code}</code>\n"
            f"<b>Ссылка:</b> <code>{link}</code>\n\n"
            f"Отправьте эту ссылку пользователям для отслеживания источника."
        )
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="📱 QR-код", callback_data=f"source:qr:{source_code}")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data=f"source:edit:{source_code}")],
            ]
        )
        await call.message.edit_text(text, reply_markup=kb)
        await call.answer()
        return

    elif action == "qr":
        source_code = parts[2]
        bot_username = await get_bot_username(call.bot)
        if not bot_username:
            await call.answer("❌ Не удалось получить username бота", show_alert=True)
            return

        link = f"https://t.me/{bot_username}?start={source_code}"
        
        # Генерируем QR-код
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(link)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        bio = BytesIO()
        bio.name = f"qr_{source_code}.png"
        img.save(bio, "PNG")
        bio.seek(0)

        qr_file = BufferedInputFile(bio.getvalue(), filename=f"qr_{source_code}.png")

        await call.message.answer_photo(
            qr_file,
            caption=(
                f"📱 <b>QR-код для источника</b>\n\n"
                f"<b>Код:</b> <code>{source_code}</code>\n"
                f"<b>Ссылка:</b> <code>{link}</code>\n\n"
                f"Отсканируйте этот QR-код для перехода в бота с источником."
            )
        )
        await call.answer()
        return

    elif action == "delete":
        source_code = parts[2]
        source = await get_source_by_code(source_code)
        if not source:
            await call.answer("❌ Источник не найден", show_alert=True)
            return

        # Подтверждение удаления
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="🗑️ Удалить", callback_data=f"source:confirm_delete:{source_code}")],
                [InlineKeyboardButton(text="❌ Отмена", callback_data=f"source:edit:{source_code}")],
            ]
        )
        await call.message.edit_text(
            f"🗑️ <b>Удаление источника</b>\n\n"
            f"Вы уверены, что хотите удалить источник?\n\n"
            f"<b>Название:</b> {source['title']}\n"
            f"<b>Код:</b> <code>{source_code}</code>\n\n"
            f"⚠️ Это действие нельзя отменить!",
            reply_markup=kb
        )
        await call.answer()
        return

    elif action == "confirm_delete":
        source_code = parts[2]
        if await delete_source(source_code):
            await call.message.edit_text(
                "✅ <b>Источник удалён!</b>\n\n"
                "Источник успешно удалён из системы.",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:sources")]]
                )
            )
        else:
            await call.answer("❌ Ошибка при удалении источника", show_alert=True)
        return


async def handle_source_text(message: Message, state: FSMContext) -> None:
    """Обработка текстовых сообщений для управления источниками"""
    current_state = await state.get_state()
    data = await state.get_data()

    if current_state == SourceState.adding_title:
        title = message.text.strip()
        if not title:
            await message.answer("❌ Название не может быть пустым. Попробуйте снова.")
            return

        await state.update_data(title=title)
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:sources")]]
        )
        await message.answer(
            "📝 <b>Код источника</b>\n\n"
            "Отправьте уникальный код для источника (только латинские буквы, цифры, дефис и подчёркивание, 3-64 символа).\n\n"
            "Пример: <code>instagram_ads</code>",
            reply_markup=cancel_kb
        )
        await state.set_state(SourceState.adding_code)

    elif current_state == SourceState.adding_code:
        code = message.text.strip()
        if not code or len(code) < 3 or len(code) > 64:
            await message.answer("❌ Код должен быть от 3 до 64 символов. Попробуйте снова.")
            return

        # Простая валидация (можно улучшить)
        import re
        if not re.match(r"^[a-zA-Z0-9_-]+$", code):
            await message.answer("❌ Код может содержать только латинские буквы, цифры, дефис и подчёркивание. Попробуйте снова.")
            return

        # Проверка уникальности
        existing = await get_source_by_code(code)
        if existing:
            await message.answer(f"❌ Источник с кодом <code>{code}</code> уже существует. Выберите другой код.")
            return

        await state.update_data(code=code)
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:sources")]]
        )
        await message.answer(
            "📝 <b>Описание источника</b>\n\n"
            "Отправьте описание источника одним сообщением (или отправьте точку '.' чтобы пропустить):",
            reply_markup=cancel_kb
        )
        await state.set_state(SourceState.adding_desc)

    elif current_state == SourceState.adding_desc:
        desc = message.text.strip()
        if desc == ".":
            desc = None

        data = await state.get_data()
        title = data["title"]
        code = data["code"]

        if await create_source(code, title, desc):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:sources")]]
            )
            await message.answer(
                "✅ <b>Источник создан!</b>\n\n"
                f"<b>Название:</b> {title}\n"
                f"<b>Код:</b> <code>{code}</code>\n"
                f"<b>Описание:</b> {desc or '(нет)'}\n\n"
                "Теперь можно использовать ссылку и QR-код для этого источника.",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка при создании источника. Возможно, код уже занят.")
        await state.clear()

    elif current_state == SourceState.editing_title:
        new_title = message.text.strip()
        if not new_title:
            await message.answer("❌ Название не может быть пустым. Попробуйте снова.")
            return

        source_code = data["source_code"]
        if await update_source_title(source_code, new_title):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data=f"source:edit:{source_code}")]]
            )
            await message.answer(
                "✅ <b>Название обновлено!</b>\n\n"
                f"<b>Новое название:</b> {new_title}",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка при обновлении названия.")
        await state.clear()

    elif current_state == SourceState.editing_desc:
        new_desc = message.text.strip()
        if new_desc == ".":
            new_desc = None

        source_code = data["source_code"]
        if await update_source_description(source_code, new_desc):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data=f"source:edit:{source_code}")]]
            )
            await message.answer(
                "✅ <b>Описание обновлено!</b>\n\n"
                f"<b>Новое описание:</b> {new_desc or '(нет)'}",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка при обновлении описания.")
        await state.clear()
