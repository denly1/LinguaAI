"""
Обработчики для админ-панели: редактирование текстов через бота
"""
from aiogram.types import CallbackQuery, Message, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import admin_panel


class AdminEditState(StatesGroup):
    editing_welcome = State()
    editing_about = State()
    editing_critical = State()
    editing_service = State()
    editing_faq_question = State()
    editing_faq_answer = State()
    adding_admin = State()
    removing_admin = State()
    editing_bitrix_webhook = State()


async def cancel_edit_callback(call: CallbackQuery, state: FSMContext) -> None:
    """Обработка нажатия кнопки Отмена"""
    await state.clear()
    await call.answer("❌ Отменено")


async def edit_text_callback(call: CallbackQuery, state: FSMContext) -> None:
    """Обработка выбора раздела для редактирования"""
    action = call.data.split(":")[1]
    
    if action == "welcome":
        texts = admin_panel.load_texts_file()
        current_text = texts.get("welcome", "")
        
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:edit_texts")]]
        )
        await call.message.edit_text(
            f"👋 <b>Редактирование приветствия</b>\n\n"
            f"<b>Текущий текст:</b>\n<code>{current_text}</code>\n\n"
            f"📝 Отправьте новый текст приветствия одним сообщением:",
            reply_markup=cancel_kb
        )
        await state.set_state(AdminEditState.editing_welcome)
        await state.update_data(editing_section="welcome")
        await call.answer()
    
    elif action == "about":
        texts = admin_panel.load_texts_file()
        current_text = texts.get("about", {}).get("text", "")
        
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:edit_texts")]]
        )
        await call.message.edit_text(
            f"🏥 <b>Редактирование раздела 'О клинике'</b>\n\n"
            f"<b>Текущий текст:</b>\n<code>{current_text[:300]}...</code>\n\n"
            f"📝 Отправьте новый текст одним сообщением:",
            reply_markup=cancel_kb
        )
        await state.set_state(AdminEditState.editing_about)
        await state.update_data(editing_section="about")
        await call.answer()
    
    elif action == "critical":
        texts = admin_panel.load_texts_file()
        current_text = texts.get("critical", "")
        
        cancel_kb = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="admin:edit_texts")]]
        )
        await call.message.edit_text(
            f"⚠️ <b>Редактирование критического сообщения</b>\n\n"
            f"<b>Текущий текст:</b>\n<code>{current_text}</code>\n\n"
            f"📝 Отправьте новый текст одним сообщением:",
            reply_markup=cancel_kb
        )
        await state.set_state(AdminEditState.editing_critical)
        await state.update_data(editing_section="critical")
        await call.answer()
    
    elif action == "services":
        services_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="Вывод из запоя", callback_data="edit_svc:detox")],
                [InlineKeyboardButton(text="Капельницы", callback_data="edit_svc:iv")],
                [InlineKeyboardButton(text="Реабилитация", callback_data="edit_svc:rehab")],
                [InlineKeyboardButton(text="Консультация", callback_data="edit_svc:consult")],
                [InlineKeyboardButton(text="Поддержка родственников", callback_data="edit_svc:family")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:edit_texts")],
            ]
        )
        await call.message.edit_text(
            "🧾 <b>Редактирование услуг</b>\n\n"
            "Выберите услугу для редактирования:",
            reply_markup=services_kb
        )
        await call.answer()
    
    elif action == "faq":
        texts = admin_panel.load_texts_file()
        faq_items = texts.get("faq", {}).get("items", [])
        
        faq_kb_buttons = []
        for i, item in enumerate(faq_items, 1):
            faq_kb_buttons.append([InlineKeyboardButton(
                text=f"{i}. {item['q'][:30]}...", 
                callback_data=f"edit_faq:{i-1}"
            )])
        faq_kb_buttons.append([InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:edit_texts")])
        
        faq_kb = InlineKeyboardMarkup(inline_keyboard=faq_kb_buttons)
        
        await call.message.edit_text(
            "❓ <b>Редактирование FAQ</b>\n\n"
            "Выберите вопрос для редактирования:",
            reply_markup=faq_kb
        )
        await call.answer()


async def edit_service_callback(call: CallbackQuery, state: FSMContext) -> None:
    """Обработка выбора услуги для редактирования"""
    service_key = call.data.split(":")[1]
    texts = admin_panel.load_texts_file()
    service = texts["services"]["items"].get(service_key, {})
    
    service_info = (
        f"<b>Название:</b> {service.get('name', '')}\n"
        f"<b>Краткое описание:</b> {service.get('short', '')}\n"
        f"<b>Когда подходит:</b> {service.get('when', '')}\n"
        f"<b>Длительность:</b> {service.get('duration', '')}\n"
        f"<b>Стоимость:</b> {service.get('price', '')}"
    )
    
    edit_svc_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Название", callback_data=f"edit_svc_field:{service_key}:name")],
            [InlineKeyboardButton(text="Краткое описание", callback_data=f"edit_svc_field:{service_key}:short")],
            [InlineKeyboardButton(text="Когда подходит", callback_data=f"edit_svc_field:{service_key}:when")],
            [InlineKeyboardButton(text="Длительность", callback_data=f"edit_svc_field:{service_key}:duration")],
            [InlineKeyboardButton(text="Стоимость", callback_data=f"edit_svc_field:{service_key}:price")],
            [InlineKeyboardButton(text="⬅️ Назад", callback_data="edit:services")],
        ]
    )
    
    await call.message.edit_text(
        f"🧾 <b>Редактирование услуги</b>\n\n"
        f"{service_info}\n\n"
        f"Выберите поле для редактирования:",
        reply_markup=edit_svc_kb
    )
    await call.answer()


async def edit_service_field_callback(call: CallbackQuery, state: FSMContext) -> None:
    """Обработка выбора поля услуги для редактирования"""
    parts = call.data.split(":")
    service_key = parts[1]
    field_name = parts[2]
    
    texts = admin_panel.load_texts_file()
    service = texts["services"]["items"].get(service_key, {})
    current_value = service.get(field_name, "")
    
    field_names = {
        "name": "Название",
        "short": "Краткое описание",
        "when": "Когда подходит",
        "duration": "Длительность",
        "price": "Стоимость"
    }
    
    cancel_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data=f"edit_svc:{service_key}")]]
    )
    
    await call.message.edit_text(
        f"✏️ <b>Редактирование: {field_names.get(field_name, field_name)}</b>\n\n"
        f"<b>Текущее значение:</b>\n<code>{current_value}</code>\n\n"
        f"📝 Отправьте новое значение одним сообщением:",
        reply_markup=cancel_kb
    )
    
    await state.set_state(AdminEditState.editing_service)
    await state.update_data(service_key=service_key, field_name=field_name)
    await call.answer()


async def edit_faq_callback(call: CallbackQuery, state: FSMContext) -> None:
    """Обработка выбора вопроса FAQ для редактирования"""
    faq_index = int(call.data.split(":")[1])
    texts = admin_panel.load_texts_file()
    faq_item = texts["faq"]["items"][faq_index]
    
    cancel_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data="edit:faq")]]
    )
    await call.message.edit_text(
        f"❓ <b>Редактирование вопроса FAQ</b>\n\n"
        f"<b>Текущий вопрос:</b>\n<code>{faq_item['q']}</code>\n\n"
        f"<b>Текущий ответ:</b>\n<code>{faq_item['a']}</code>\n\n"
        f"📝 Отправьте новый вопрос и ответ в формате:\n"
        f"<code>ВОПРОС\n---\nОТВЕТ</code>",
        reply_markup=cancel_kb
    )
    await state.set_state(AdminEditState.editing_faq_question)
    await state.update_data(faq_index=faq_index)
    await call.answer()


async def handle_text_edit(message: Message, state: FSMContext) -> None:
    """Обработка ввода нового текста"""
    current_state = await state.get_state()
    data = await state.get_data()
    
    if current_state == AdminEditState.editing_welcome:
        new_text = message.text.strip()
        if admin_panel.update_welcome_text(new_text):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
            )
            await message.answer(
                "✅ <b>Приветствие обновлено!</b>\n\n"
                "Изменения вступят в силу после перезапуска бота.",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка сохранения. Попробуйте снова.")
        await state.clear()
    
    elif current_state == AdminEditState.editing_about:
        new_text = message.text.strip()
        if admin_panel.update_about_text(new_text):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
            )
            await message.answer(
                "✅ <b>Раздел 'О клинике' обновлён!</b>\n\n"
                "Изменения вступят в силу после перезапуска бота.",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка сохранения. Попробуйте снова.")
        await state.clear()
    
    elif current_state == AdminEditState.editing_critical:
        new_text = message.text.strip()
        if admin_panel.update_critical_text(new_text):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
            )
            await message.answer(
                "✅ <b>Критическое сообщение обновлено!</b>\n\n"
                "Изменения вступят в силу после перезапуска бота.",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка сохранения. Попробуйте снова.")
        await state.clear()
    
    elif current_state == AdminEditState.editing_service:
        data = await state.get_data()
        service_key = data.get("service_key")
        field_name = data.get("field_name")
        new_value = message.text.strip()
        
        if admin_panel.update_service_field(service_key, field_name, new_value):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
            )
            await message.answer(
                "✅ <b>Поле услуги обновлено!</b>\n\n"
                "Изменения вступят в силу после перезапуска бота.",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка сохранения. Попробуйте снова.")
        await state.clear()
    
    elif current_state == AdminEditState.editing_faq_question:
        faq_index = data.get("faq_index")
        text = message.text.strip()
        
        if "---" not in text:
            await message.answer("❌ Неверный формат. Используйте:\nВОПРОС\n---\nОТВЕТ")
            return
        
        question, answer = text.split("---", 1)
        question = question.strip()
        answer = answer.strip()
        
        if admin_panel.update_faq_question(faq_index, question, answer):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
            )
            await message.answer(
                "✅ <b>Вопрос FAQ обновлён!</b>\n\n"
                "Изменения вступят в силу после перезапуска бота.",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Ошибка сохранения. Попробуйте снова.")
        await state.clear()
    
    elif current_state == AdminEditState.adding_admin:
        text_input = message.text.strip()
        
        # Проверяем, это username или ID
        if text_input.startswith('@'):
            # Это username - нужно получить ID
            username = text_input[1:]  # Убираем @
            try:
                # Пытаемся получить информацию о пользователе
                chat = await message.bot.get_chat(f"@{username}")
                new_admin_id = chat.id
            except Exception as e:
                await message.answer(
                    f"❌ <b>Ошибка!</b>\n\n"
                    f"Не удалось найти пользователя @{username}.\n\n"
                    f"Убедитесь, что username указан верно или используйте ID."
                )
                return
        else:
            # Это ID
            try:
                new_admin_id = int(text_input)
            except ValueError:
                await message.answer(
                    "❌ <b>Неверный формат!</b>\n\n"
                    "Отправьте Telegram ID (число) или @username."
                )
                return
        
        if admin_panel.add_admin(new_admin_id):
            back_kb = InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
            )
            await message.answer(
                f"✅ <b>Администратор добавлен!</b>\n\n"
                f"ID: <code>{new_admin_id}</code>\n\n"
                f"Изменения вступят в силу после перезапуска бота.",
                reply_markup=back_kb
            )
        else:
            await message.answer("❌ Этот админ уже существует или ошибка сохранения.")
        await state.clear()
    
    elif current_state == AdminEditState.removing_admin:
        try:
            admin_id = int(message.text.strip())
            if admin_panel.remove_admin(admin_id):
                back_kb = InlineKeyboardMarkup(
                    inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
                )
                await message.answer(
                    f"✅ <b>Администратор удалён!</b>\n\n"
                    f"ID: <code>{admin_id}</code>\n\n"
                    f"Изменения вступят в силу после перезапуска бота.",
                    reply_markup=back_kb
                )
            else:
                await message.answer("❌ Админ не найден или это последний админ (нельзя удалить).")
        except ValueError:
            await message.answer("❌ Неверный формат ID. Отправьте число.")
            return
        await state.clear()
    
    elif current_state == AdminEditState.editing_bitrix_webhook:
        webhook_url = message.text.strip()
        if webhook_url.startswith("http"):
            if admin_panel.update_bitrix_webhook(webhook_url):
                back_kb = InlineKeyboardMarkup(
                    inline_keyboard=[[InlineKeyboardButton(text="🏠 Вернуться в меню", callback_data="admin:back")]]
                )
                await message.answer(
                    "✅ <b>Bitrix24 webhook обновлён!</b>\n\n"
                    "Изменения вступят в силу после перезапуска бота.",
                    reply_markup=back_kb
                )
            else:
                await message.answer("❌ Ошибка сохранения. Попробуйте снова.")
        else:
            await message.answer("❌ URL должен начинаться с http:// или https://")
            return
        await state.clear()
