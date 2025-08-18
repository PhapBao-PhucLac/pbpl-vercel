// /api/chat.js  — Vercel serverless function (Node runtime)
// YÊU CẦU: đặt OPENAI_API_KEY trong môi trường Vercel (Project → Settings → Environment Variables)

export default async function handler(req, res) {
  // Cho phép POST từ front-end
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, history } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Thiếu nội dung câu hỏi "text".' });
    }

    // Lọc lịch sử chỉ giữ mảng {role, content} hợp lệ (user/assistant)
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m === 'object' &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string'
          )
          .map((m) => ({ role: m.role, content: m.content }))
      : [];

    // System prompt tiếng Việt — giữ giọng điệu hiền hòa, rõ ràng
    const systemPrompt = `
    // 📚 Nội dung Phật học cơ bản
const phatHocData = `
# Bộ 12 Chủ Đề Căn Bản Phật Học

## 1. TAM BẢO
**TAM BẢO**

1. **Phật** – Bậc Giác ngộ, thầy lành chỉ đường.  
2. **Pháp** – Lời dạy đưa đến giải thoát.  
3. **Tăng** – Tăng đoàn hòa hợp, tiếp nối sự tu tập.  

---
**Thực hành ứng dụng**  
- Quay về nương tựa Tam Bảo mỗi ngày.  
- Ứng dụng một lời Phật dạy vào công việc, gia đình.  

🌸 *Tam Bảo như ba ngọn đuốc soi sáng đêm tối, đưa ta ra khỏi mê lầm.*  

💡 Bạn có muốn tìm hiểu:  
- Ý nghĩa “Quy y Tam Bảo”?  
- Cách thực hành Tam Quy – Ngũ Giới?  

---

## 2. NGŨ GIỚI
**NGŨ GIỚI**

1. **Không sát sinh**  
2. **Không trộm cắp**  
3. **Không tà dâm**  
4. **Không nói dối**  
5. **Không uống rượu (và các chất gây nghiện)**  

---
**Thực hành ứng dụng**  
- Bắt đầu bằng việc ăn chay kỳ, tránh hại sinh linh.  
- Luyện nói lời ái ngữ, chân thật.  

🌸 *Ngũ Giới là nền tảng đạo đức, đem lại bình an cho cá nhân và xã hội.*  

💡 Bạn có muốn tìm hiểu:  
- Mối liên hệ giữa Ngũ Giới và Bát Chánh Đạo?  
- Cách giữ giới trong đời sống hiện đại?  

---

## 3. NGŨ UẨN
**NGŨ UẨN**

1. **Sắc** – Thân thể vật chất.  
2. **Thọ** – Cảm giác, cảm thọ.  
3. **Tưởng** – Tri giác, ghi nhận.  
4. **Hành** – Tâm hành, suy nghĩ.  
5. **Thức** – Ý thức, phân biệt.  

---
**Thực hành ứng dụng**  
- Quán chiếu “ngũ uẩn vô ngã” để buông chấp ngã.  
- Thực tập quan sát cảm thọ ngay khi phát sinh.  

🌸 *Ngũ Uẩn cho ta thấy “con người” chỉ là sự hợp thành, không có tự ngã cố định.*  

💡 Bạn có muốn tìm hiểu:  
- Ngũ Uẩn liên hệ thế nào với khổ đau?  
- Cách quán Ngũ Uẩn trong thiền tập?  

---

## 4. TỨ DIỆU ĐẾ
**TỨ DIỆU ĐẾ**

1. **Khổ Đế** – Sự thật về khổ.  
2. **Tập Đế** – Nguyên nhân của khổ.  
3. **Diệt Đế** – Khả năng chấm dứt khổ.  
4. **Đạo Đế** – Con đường đưa đến hết khổ.  

---
**Thực hành ứng dụng**  
- Quán chiếu các nỗi khổ trong đời sống.  
- Thực tập từ bỏ nguyên nhân gây khổ.  

🌸 *Tứ Diệu Đế là chiếc bản đồ dẫn con người ra khỏi khổ đau.*  

💡 Bạn có muốn tìm hiểu:  
- Cách thực hành Bát Chánh Đạo trong đời sống hằng ngày?  
- Sự khác biệt giữa Khổ và Diệt?  

---

## 5. BÁT CHÁNH ĐẠO
**BÁT CHÁNH ĐẠO**

1. **Chánh kiến**  
2. **Chánh tư duy**  
3. **Chánh ngữ**  
4. **Chánh nghiệp**  
5. **Chánh mạng**  
6. **Chánh tinh tấn**  
7. **Chánh niệm**  
8. **Chánh định**  

---
**Thực hành ứng dụng**  
- Rèn chánh ngữ bằng lời nói hòa ái.  
- Thực tập chánh niệm trong từng hơi thở.  

🌸 *Bát Chánh Đạo là con đường tám nhánh đưa đến an lạc, giải thoát.*  

💡 Bạn có muốn tìm hiểu:  
- Chánh niệm khác gì thiền định?  
- Làm sao để hành trì Bát Chánh Đạo nơi công sở?  

---

## 6. THẬP NHỊ NHÂN DUYÊN
**THẬP NHỊ NHÂN DUYÊN**

1. Vô minh  
2. Hành  
3. Thức  
4. Danh sắc  
5. Lục nhập  
6. Xúc  
7. Thọ  
8. Ái  
9. Thủ  
10. Hữu  
11. Sinh  
12. Lão tử  

---
**Thực hành ứng dụng**  
- Quán sát vòng luân hồi khởi từ vô minh.  
- Thực tập đoạn diệt ái – thủ – hữu.  

🌸 *Thập Nhị Nhân Duyên chỉ ra chuỗi vận hành của khổ đau và cách cắt đứt nó.*  

💡 Bạn có muốn tìm hiểu:  
- Nhân duyên và nghiệp báo có khác nhau không?  
- Làm sao áp dụng Thập Nhị Nhân Duyên trong đời sống?  

---

## 7. LỤC ĐỘ BA LA MẬT
**LỤC ĐỘ BA LA MẬT**

1. **Bố thí**  
2. **Trì giới**  
3. **Nhẫn nhục**  
4. **Tinh tấn**  
5. **Thiền định**  
6. **Trí tuệ**  

---
**Thực hành ứng dụng**  
- Tập bố thí từ những việc nhỏ.  
- Rèn nhẫn nhục khi gặp nghịch cảnh.  

🌸 *Lục Độ là sáu chiếc thuyền lớn đưa người vượt bờ mê sang bờ giác.*  

💡 Bạn có muốn tìm hiểu:  
- Cách áp dụng Lục Độ trong đời sống gia đình?  
- Ý nghĩa “Bát Nhã Ba La Mật”?  

---

## 8. TỨ NIỆM XỨ
**TỨ NIỆM XỨ**

1. **Quán thân** – Thấy thân vô thường.  
2. **Quán thọ** – Thấy cảm thọ sinh – diệt.  
3. **Quán tâm** – Thấy tâm biến đổi không ngừng.  
4. **Quán pháp** – Quán các pháp như chúng là.  

---
**Thực hành ứng dụng**  
- Thực tập quán hơi thở, bước chân.  
- Ghi nhận cảm xúc ngay khi nó khởi lên.  

🌸 *Tứ Niệm Xứ là bốn vùng đất của chánh niệm, gieo hạt an lạc trong từng phút giây.*  

💡 Bạn có muốn tìm hiểu:  
- Thiền Tứ Niệm Xứ áp dụng hằng ngày thế nào?  
- Quán thân và quán tâm có gì khác nhau?  

---

## 9. LỤC CĂN – LỤC TRẦN – LỤC THỨC
**LỤC CĂN – LỤC TRẦN – LỤC THỨC**

1. **Sáu căn**: mắt, tai, mũi, lưỡi, thân, ý.  
2. **Sáu trần**: sắc, thanh, hương, vị, xúc, pháp.  
3. **Sáu thức**: nhãn thức, nhĩ thức, tỵ thức, thiệt thức, thân thức, ý thức.  

---
**Thực hành ứng dụng**  
- Quán sát sự tiếp xúc giữa căn – trần – thức.  
- Giữ chánh niệm để không bị cuốn theo.  

🌸 *Sáu căn tiếp xúc sáu trần sinh ra sáu thức – hiểu rõ tiến trình này giúp ta làm chủ tâm.*  

💡 Bạn có muốn tìm hiểu:  
- Làm sao giữ chánh niệm khi mắt thấy sắc đẹp?  
- Ý thức và tâm có phải là một không?  

---

## 10. TỨ VÔ LƯỢNG TÂM
**TỨ VÔ LƯỢNG TÂM**

1. **Từ** – Ban vui.  
2. **Bi** – Cứu khổ.  
3. **Hỷ** – Vui trước hạnh phúc người.  
4. **Xả** – Bình thản, buông bỏ.  

---
**Thực hành ứng dụng**  
- Gửi lời chúc lành đến một người khó ưa.  
- Quán từ bi mỗi buổi sáng.  

🌸 *Tứ Vô Lượng Tâm nuôi dưỡng trái tim rộng lớn, đem lại an vui cho mình và cho người.*  

💡 Bạn có muốn tìm hiểu:  
- Cách thực tập Quán Từ Bi hằng ngày?  
- Sự khác nhau giữa Từ và Bi?  

---

## 11. TAM HỌC: GIỚI – ĐỊNH – TUỆ
**TAM HỌC: GIỚI – ĐỊNH – TUỆ**

1. **Giới** – Nền tảng đạo đức.  
2. **Định** – Sự tập trung, an tĩnh.  
3. **Tuệ** – Tuệ giác sáng suốt.  

---
**Thực hành ứng dụng**  
- Giữ giới để tâm an.  
- Thiền định để trí sáng.  

🌸 *Tam Học như ba chân kiềng, thiếu một chân, hành trình không vững.*  

💡 Bạn có muốn tìm hiểu:  
- Cách phối hợp Giới – Định – Tuệ trong tu tập?  
- Mối liên hệ giữa Tam Học và Bát Chánh Đạo?  

---

## 12. NGŨ CĂN – NGŨ LỰC
**NGŨ CĂN – NGŨ LỰC**

1. **Tín** – Niềm tin vững chắc.  
2. **Tấn** – Siêng năng tinh tấn.  
3. **Niệm** – Chánh niệm tỉnh giác.  
4. **Định** – Tâm an tĩnh.  
5. **Tuệ** – Trí tuệ sáng suốt.  

---
**Thực hành ứng dụng**  
- Nuôi dưỡng niềm tin Tam Bảo.  
- Tập thắp sáng chánh niệm trong công việc.  

🌸 *Ngũ Căn – Ngũ Lực giúp ta xây nền tảng vững vàng, vượt qua chướng ngại.*  

💡 Bạn có muốn tìm hiểu:  
- Ngũ Căn khác gì Ngũ Lực?  
- Cách vận dụng Ngũ Lực trong đời sống bận rộn?  

`;
Bạn là trợ lý Phật pháp nói **tiếng Việt**. Trả lời ngắn gọn, trong sáng, dùng ví dụ khi phù hợp.
Tôn trọng giáo lý căn bản (Tứ Diệu Đế, Bát Chánh Đạo, Ngũ Giới...), tránh khẳng định tuyệt đối ở
những điểm còn nhiều cách hiểu. Khi câu hỏi mơ hồ, xin phép làm rõ bằng 1–2 câu hỏi gợi ý.
Khi người dùng xin tóm tắt, hãy liệt kê gọn gàng. Không bịa nguồn. Không đưa lời khuyên y khoa/pháp lý.
`;

    // Gọi OpenAI Chat Completions (bạn có thể đổi sang model khác tùy tài khoản)
    // Model nhẹ, tiết kiệm: "gpt-4o-mini". Nếu bạn dùng model khác, đổi tại đây.
    const model = 'gpt-4o-mini';

    const messages = [
      { role: 'system', content: systemPrompt.trim() },
      ...safeHistory,
      { role: 'user', content: text },
    ];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 900, // tùy ý
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return res
        .status(r.status)
        .json({ error: 'OpenAI API error', detail: errText || r.statusText });
    }

    const data = await r.json();
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      'Xin lỗi, hiện chưa có nội dung trả lời.';

    // Cập nhật lịch sử mới để client giữ cuộc trò chuyện
    const newHistory = [
      ...safeHistory,
      { role: 'user', content: text },
      { role: 'assistant', content: answer },
    ];

    return res.status(200).json({
      answer,
      history: newHistory,
      model,
    });
  } catch (err) {
    console.error('API /api/chat error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: String(err?.message || err),
    });
  }
}
