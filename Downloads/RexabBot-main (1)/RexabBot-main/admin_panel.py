"""
Модуль админ-панели для редактирования текстов и настроек через бота
"""
import os
import yaml
from typing import Dict, Any, List
from dotenv import load_dotenv, set_key


def load_texts_file() -> Dict[str, Any]:
    """Загрузить texts.yml"""
    with open("texts.yml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_texts_file(texts: Dict[str, Any]) -> bool:
    """Сохранить изменения в texts.yml"""
    try:
        with open("texts.yml", "w", encoding="utf-8") as f:
            yaml.dump(texts, f, allow_unicode=True, sort_keys=False, default_flow_style=False)
        return True
    except Exception as e:
        print(f"Ошибка сохранения texts.yml: {e}")
        return False


def update_welcome_text(new_text: str) -> bool:
    """Обновить текст приветствия"""
    texts = load_texts_file()
    texts["welcome"] = new_text
    return save_texts_file(texts)


def update_about_text(new_text: str) -> bool:
    """Обновить текст О клинике"""
    texts = load_texts_file()
    texts["about"]["text"] = new_text
    return save_texts_file(texts)


def update_critical_text(new_text: str) -> bool:
    """Обновить критическое сообщение"""
    texts = load_texts_file()
    texts["critical"] = new_text
    return save_texts_file(texts)


def update_emergency_text(new_text: str) -> bool:
    """Обновить текст экстренной помощи"""
    texts = load_texts_file()
    texts["emergency"] = new_text
    return save_texts_file(texts)


def update_service(service_key: str, field: str, value: Any) -> bool:
    """Обновить поле услуги"""
    texts = load_texts_file()
    if service_key not in texts["services"]["items"]:
        return False
    texts["services"]["items"][service_key][field] = value
    return save_texts_file(texts)


def update_service_field(service_key: str, field: str, value: Any) -> bool:
    """Обновить поле услуги (алиас для update_service)"""
    return update_service(service_key, field, value)


def update_faq_question(index: int, question: str, answer: str) -> bool:
    """Обновить вопрос FAQ"""
    texts = load_texts_file()
    if index < 0 or index >= len(texts["faq"]["items"]):
        return False
    texts["faq"]["items"][index]["q"] = question
    texts["faq"]["items"][index]["a"] = answer
    return save_texts_file(texts)


def get_admin_ids() -> List[int]:
    """Получить список ID админов"""
    load_dotenv()
    raw_admins = os.getenv("ADMIN_CHAT_IDS", "").strip()
    admin_ids = []
    for part in raw_admins.split(","):
        part = part.strip()
        if part:
            admin_ids.append(int(part))
    return admin_ids


def add_admin(new_admin_id: int) -> bool:
    """Добавить нового админа"""
    try:
        admins = get_admin_ids()
        if new_admin_id in admins:
            return False
        admins.append(new_admin_id)
        new_value = ",".join(map(str, admins))
        set_key(".env", "ADMIN_CHAT_IDS", new_value)
        return True
    except Exception as e:
        print(f"Ошибка добавления админа: {e}")
        return False


def remove_admin(admin_id: int) -> bool:
    """Удалить админа"""
    try:
        admins = get_admin_ids()
        if admin_id not in admins:
            return False
        if len(admins) == 1:
            return False  # Нельзя удалить последнего админа
        admins.remove(admin_id)
        new_value = ",".join(map(str, admins))
        set_key(".env", "ADMIN_CHAT_IDS", new_value)
        return True
    except Exception as e:
        print(f"Ошибка удаления админа: {e}")
        return False


def update_bitrix_webhook(webhook_url: str) -> bool:
    """Обновить Bitrix24 webhook"""
    try:
        set_key(".env", "BITRIX_WEBHOOK_URL", webhook_url)
        return True
    except Exception as e:
        print(f"Ошибка обновления webhook: {e}")
        return False


def get_current_settings() -> Dict[str, Any]:
    """Получить текущие настройки"""
    load_dotenv()
    return {
        "admin_ids": get_admin_ids(),
        "bitrix_webhook": os.getenv("BITRIX_WEBHOOK_URL", "Не настроен"),
        "db_name": os.getenv("DB_NAME", "Clinicapro"),
        "db_host": os.getenv("DB_HOST", "localhost"),
    }
