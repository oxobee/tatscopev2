# TatScope Local Development

Bu proje iki parçadan oluşur:
- `backend/` — FastAPI + MongoDB API
- `frontend/` — React + CRA UI

## Gerekenler

- Python 3.11+ veya uyumlu bir sürüm
- Node.js / Yarn
- MongoDB (yerel veya Atlas)

## Adım 1: Backend yapılandırma

1. `backend/.env.example` dosyasını kopyala:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. `backend/.env` dosyasını aç ve değerleri doldur:

   - `MONGO_URL`: MongoDB bağlantı dizesi
   - `DB_NAME`: Kullanılacak veritabanı adı
   - `JWT_SECRET`: Güçlü bir rastgele metin

   Örnek:

   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=tattoomatch
   JWT_SECRET=super_secret_key_12345
   ```

3. Backend bağımlılıklarını yükle:

   ```bash
   cd backend
   python -m pip install -r requirements.txt
   ```

4. Backend sunucusunu çalıştır:

   ```bash
   cd backend
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

5. Sağlık kontrolü için tarayıcıda aç:

   ```
   http://localhost:8000/api/
   ```

## Adım 2: Frontend yapılandırma

1. `frontend/.env.example` dosyasını kopyala:

   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. `frontend/.env` dosyasında backend adresini doğrula:

   ```env
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

3. Frontend bağımlılıklarını yükle:

   ```bash
   cd frontend
   yarn install
   ```

4. Frontend uygulamasını başlat:

   ```bash
   cd frontend
   yarn start
   ```

5. Tarayıcıda aç:

   ```
   http://localhost:3000
   ```

## Adım 3: Kayıt olma / giriş yapma

- Yeni kullanıcı oluşturmak için frontend üzerinden kayıt sayfasını kullanabilirsin.
- Daha sonra aynı email / şifre ile giriş yapabilirsin.
- Backend, JWT tabanlı oturum yönetimi kullanır:
  - `access_token` ve `refresh_token` çerez olarak saklanır
  - `GET /api/auth/me` ile etkin kullanıcı çekilir

## Ek notlar

- Eğer MongoDB yerel olarak kurulu değilse, MongoDB Atlas kullanabilirsin.
- `JWT_SECRET` güvenli olmalı; üretimde uzun ve rastgele bir değer kullan.
- Eğer backend `server.py` çalışmazsa, eksik env değişkenleri için mesaj alırsın.
- Frontend `REACT_APP_BACKEND_URL` doğru ayarlıysa, yerel backend ile tam oturum akışı çalışmalıdır.
