import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def init_database():
    load_dotenv()
    
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))
    db_name = os.getenv("DB_NAME", "Clinicapro")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "1")
    
    print(f"Подключение к {db_name}@{db_host}:{db_port}...")
    
    try:
        conn = await asyncpg.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        
        print("✓ Подключено к БД")
        
        with open("init_db.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        
        await conn.execute(sql)
        print("✓ Таблицы созданы")
        
        await conn.close()
        print("✓ Готово! Теперь можно запускать бота: python bot.py")
        
    except asyncpg.InvalidCatalogNameError:
        print(f"❌ База данных '{db_name}' не существует!")
        print(f"\nСоздайте её вручную:")
        print(f"1. Откройте pgAdmin или psql")
        print(f"2. Выполните: CREATE DATABASE {db_name};")
        print(f"3. Запустите этот скрипт снова")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(init_database())
