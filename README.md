# PBPL (Pháp Bảo Phúc Lạc) trên Vercel

## Cách deploy (3 bước)
1) Tạo repo Git mới, thêm 4 file sau: `index.html`, `api/chat.js`, `package.json`, `README.md` (nội dung đã sẵn trong gói ZIP này).
2) Vào https://vercel.com → New Project → Import repository → trong Project Settings > Environment Variables thêm:
   - OPENAI_API_KEY = sk-... (bắt buộc)
   - OPENAI_MODEL  = gpt-4o-mini (tuỳ chọn)
3) Nhấn Deploy → xong. Truy cập https://<tên-dự-án>.vercel.app

## Ghi chú
- Không đưa API key vào frontend (chỉ để trong Environment Variables).
- Đổi logo/màu sắc ngay trong `index.html`.
