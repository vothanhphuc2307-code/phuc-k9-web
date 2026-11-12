'use strict';

// Seed exam data kept separate from API logic so both API endpoints and frontend fallback can use it.
module.exports = [
  {
    "id": "exam-toan-lam-dong-2026-lan1",
    "program": "2k9",
    "subject": "math",
    "grade": "12",
    "year": "2026",
    "examType": "khao-sat",
    "examPeriod": "Lần 1",
    "examSession": "Sở GD&ĐT Lâm Đồng",
    "periodLabel": "Khảo sát chất lượng • Lần 1 • 2026",
    "title": "Toán 12 • Đề khảo sát chất lượng THPT Sở GD&ĐT Lâm Đồng 2026 – Lần 1",
    "source": "Sở GD&ĐT Lâm Đồng • Đề khảo sát chất lượng THPT năm 2026 – Lần 1",
    "sourceFile": "/exam-sources/lam-dong-toan-2026-lan-1.pdf",
    "duration": 90,
    "questions": [
      {
        "id": "math-2026-lamdong-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "text": "Nghiệm của phương trình $2^{x+4}=4$ là",
        "options": [
          "x=2",
          "x=-2",
          "x=-1",
          "x=1"
        ],
        "answer": "B",
        "explanation": "Đưa 4 về $2^2$, suy ra x+4=2 nên x=-2.",
        "sourcePage": 3,
        "topic": "Mũ & Logarit",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "text": "Cho hàm số $y=f(x)$ liên tục trên R. Gọi S là diện tích hình phẳng giới hạn bởi các đường $y=f(x)$, $y=0$, $x=-1$ và $x=5$. Mệnh đề nào sau đây đúng?",
        "options": [
          "S=-∫[-1,1]f(x)dx-∫[1,5]f(x)dx",
          "S=-∫[-1,1]f(x)dx+∫[1,5]f(x)dx",
          "S=∫[-1,1]f(x)dx-∫[1,5]f(x)dx",
          "S=∫[-1,1]f(x)dx+∫[1,5]f(x)dx"
        ],
        "answer": "B",
        "explanation": "Theo hình, f(x) âm trên [-1,1] và dương trên [1,5], nên diện tích là -∫[-1,1]f + ∫[1,5]f.",
        "sourcePage": 4,
        "topic": "Nguyên hàm - Tích phân",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "text": "Cho cấp số nhân (u_n) có u_1=2 và u_2=6. Công bội q của cấp số nhân là",
        "options": [
          "q=2",
          "q=3",
          "q=4",
          "q=12"
        ],
        "answer": "B",
        "explanation": "q=u_2/u_1=6/2=3.",
        "sourcePage": 4,
        "topic": "Cấp số cộng - Cấp số nhân",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "text": "Trong không gian với hệ tọa độ Oxyz, cho mặt cầu (S): (x−1)^2+(y+2)^2+(z+1)^2=9. Tâm I của mặt cầu (S) có tọa độ là",
        "options": [
          "I(1;−2;1)",
          "I(−1;2;1)",
          "I(1;−2;−1)",
          "I(1;2;−1)"
        ],
        "answer": "C",
        "explanation": "Dạng chuẩn cho tâm I(1,−2,−1).",
        "sourcePage": 4,
        "topic": "Hình học Oxyz",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "text": "Cho hàm số y=f(x) có bảng biến thiên như hình bên. Hàm số đã cho nghịch biến trên khoảng nào dưới đây?",
        "options": [
          "(−∞;0)",
          "(0;+∞)",
          "(0;1)",
          "(−∞;1)"
        ],
        "answer": "A",
        "explanation": "Đọc dấu f'(x) trên bảng biến thiên: hàm số nghịch biến trên (−∞;0).",
        "sourcePage": 5,
        "topic": "Khảo sát hàm số",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "text": "Cho hình chóp S.ABC có đáy ABC là tam giác đều cạnh a. Biết SA ⟂ (ABC) và SA=a√3. Thể tích khối chóp S.ABC bằng",
        "options": [
          "a³/4",
          "a/4",
          "3a³/4",
          "a³/2"
        ],
        "answer": "A",
        "explanation": "Diện tích đáy tam giác đều là a²√3/4; chiều cao SA=a√3. V=1/3·a²√3/4·a√3=a³/4.",
        "sourcePage": 5,
        "topic": "Khối đa diện",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q7",
        "section": "I",
        "type": "mcq",
        "number": 7,
        "text": "Trong không gian với hệ tọa độ Oxyz, cho mặt phẳng (P): 4x−y−2z+5=0. Vectơ nào sau đây là một vectơ pháp tuyến của mặt phẳng (P)?",
        "options": [
          "n₄=(−4;−1;2)",
          "n₃=(4;1;−2)",
          "n₁=(4;−2;−1)",
          "n₂=(4;−1;−2)"
        ],
        "answer": "D",
        "explanation": "Vectơ pháp tuyến lấy trực tiếp từ các hệ số của x,y,z: (4,−1,−2).",
        "sourcePage": 6,
        "topic": "Hình học Oxyz",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q8",
        "section": "I",
        "type": "mcq",
        "number": 8,
        "text": "Họ nguyên hàm của hàm số f(x)=e^x là",
        "options": [
          "e^(x+1)/(x+1)+C",
          "e^x+C",
          "1/(e^x)+C",
          "e^x/x+C"
        ],
        "answer": "B",
        "explanation": "(e^x)'=e^x nên ∫e^x dx=e^x+C.",
        "sourcePage": 6,
        "topic": "Nguyên hàm - Tích phân",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q9",
        "section": "I",
        "type": "mcq",
        "number": 9,
        "text": "Thống kê thời gian hoàn thành một bài tập (đơn vị: phút) của một số học sinh thu được bảng tần số ghép nhóm. Thời gian trung bình (phút) là",
        "options": [
          "12,5",
          "10,4",
          "7",
          "11,3"
        ],
        "answer": "B",
        "explanation": "Dùng trung điểm các lớp và tần số trong bảng ghép nhóm, giá trị trung bình thu được 10,4 phút.",
        "sourcePage": 6,
        "table": [
          [
            "Khoảng thời gian",
            "[0;4)",
            "[4;8)",
            "[8;12)",
            "[12;16)",
            "[16;20)"
          ],
          [
            "Tần số",
            "2",
            "4",
            "7",
            "4",
            "3"
          ]
        ],
        "topic": "Thống kê ghép nhóm",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q10",
        "section": "I",
        "type": "mcq",
        "number": 10,
        "text": "Số cách chọn 5 học sinh từ 35 học sinh của lớp 11A để tham gia hoạt động tiếp sức mùa thi là",
        "options": [
          "C(35,5)",
          "C(5,5)",
          "A(35,5)",
          "5!"
        ],
        "answer": "A",
        "explanation": "Chọn 5 học sinh từ 35 học sinh: C(35,5).",
        "sourcePage": 7,
        "topic": "Tổ hợp - Xác suất",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q11",
        "section": "I",
        "type": "mcq",
        "number": 11,
        "text": "Trong không gian với hệ tọa độ Oxyz, cho hai vectơ u⃗ và v⃗ thỏa mãn |u⃗|=5, |v⃗|=8 và (u⃗,v⃗)=120°. Phát biểu nào sau đây là đúng?",
        "options": [
          "u⃗·v⃗=−20√3",
          "u⃗·v⃗=20",
          "u⃗·v⃗=40",
          "u⃗·v⃗=−20"
        ],
        "answer": "D",
        "explanation": "u·v=|u||v|cos120°=40·(−1/2)=−20.",
        "sourcePage": 7,
        "topic": "Vectơ trong không gian",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p1-q12",
        "section": "I",
        "type": "mcq",
        "number": 12,
        "text": "Cho hình chóp S.ABC có đáy ABC là tam giác vuông tại B, cạnh bên SA vuông góc với mặt đáy. Biết SA=AB. Góc giữa đường thẳng SB và mặt phẳng đáy bằng",
        "options": [
          "45°",
          "90°",
          "30°",
          "60°"
        ],
        "answer": "A",
        "explanation": "Hình chiếu của SB lên đáy là AB và SA=AB, nên tam giác SAB vuông cân tại A; góc giữa SB và mặt đáy bằng góc SBA=45°.",
        "sourcePage": 7,
        "topic": "Góc trong không gian",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "text": "Hình vẽ mô tả hiệu suất làm việc của hai công nhân tại một nhà máy trong thời gian 6 giờ. Công nhân A sản xuất với hiệu suất Q′1(t)=−2t²+4t+58 sản phẩm mỗi giờ, công nhân B sản xuất với hiệu suất Q′2(t)=53+at sản phẩm mỗi giờ. Các hàm Q1(t), Q2(t) mô phỏng số lượng sản phẩm làm được sau t giờ.",
        "statements": [
          {
            "text": "Hiệu suất làm việc cực đại của công nhân A là 60 sản phẩm mỗi giờ.",
            "answer": true
          },
          {
            "text": "Giá trị a=−3.",
            "answer": false
          },
          {
            "text": "Sau 6 giờ làm việc, công nhân B hoàn thành được 228 sản phẩm.",
            "answer": true
          },
          {
            "text": "Sau 6 giờ làm việc, số sản phẩm hoàn thành của công nhân A nhiều hơn số sản phẩm hoàn thành của công nhân B.",
            "answer": true
          }
        ],
        "explanation": "Từ Q′1 là parabol đạt đỉnh tại t=1 nên max=60. Theo điều kiện từ hình suy ra a=−5, rồi Q2(6)=228; còn Q1(6)=276 nên A nhiều hơn B.",
        "sourcePage": 9,
        "topic": "Ứng dụng tích phân",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p2-q2",
        "section": "II",
        "type": "truefalse",
        "number": 2,
        "text": "Cho hàm số y=f(x)= (x²−2x−4)/(x+1).",
        "statements": [
          {
            "text": "Hàm số đã cho có đạo hàm trên tập xác định là f′(x)=(x²+2x+2)/(x+1)².",
            "answer": true
          },
          {
            "text": "Hàm số đã cho đồng biến trên R\\{−1}.",
            "answer": true
          },
          {
            "text": "Đường tiệm cận xiên của đồ thị hàm số có phương trình y=x−3.",
            "answer": true
          },
          {
            "text": "Tâm đối xứng của đồ thị hàm số là I(1;−2).",
            "answer": false
          }
        ],
        "explanation": "f′(x)=[(2x−2)(x+1)−(x²−2x−4)]/(x+1)²=(x²+2x+2)/(x+1)²>0. Chia đa thức được y=x−3−1/(x+1), nên tiệm cận xiên y=x−3 và tâm đối xứng là (−1,−4), không phải (1,−2).",
        "sourcePage": 10,
        "topic": "Khảo sát hàm số",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p2-q3",
        "section": "II",
        "type": "truefalse",
        "number": 3,
        "text": "Hệ thống kiểm soát nội dung của một trang mạng xã hội tự động đánh dấu các bài đăng vi phạm Luật an ninh mạng. Có 25% số bài đăng bị hệ thống đánh dấu. Trong số các bài đăng bị đánh dấu, có 12% bài đăng đánh dấu nhầm. Trong số các bài đăng không bị đánh dấu, vẫn có 6% bài đăng vi phạm. Chọn ngẫu nhiên một bài đăng.",
        "statements": [
          {
            "text": "Xác suất chọn được bài đăng không bị hệ thống đánh dấu bằng 0,75.",
            "answer": true
          },
          {
            "text": "Xác suất chọn được bài đăng vi phạm, biết rằng nó không bị đánh dấu bằng 0,12.",
            "answer": false
          },
          {
            "text": "Xác suất chọn được bài đăng vi phạm bằng 0,265.",
            "answer": true
          },
          {
            "text": "Xác suất chọn được bài đăng bị đánh dấu, biết rằng nó là bài đăng vi phạm xấp xỉ bằng 0,83.",
            "answer": true
          }
        ],
        "explanation": "P(không đánh dấu)=0,75; P(vi phạm∩đánh dấu)=0,25·0,88=0,22; P(vi phạm∩không đánh dấu)=0,75·0,06=0,045 nên P(vi phạm)=0,265 và P(đánh dấu|vi phạm)=0,22/0,265≈0,83.",
        "sourcePage": 11,
        "topic": "Xác suất có điều kiện",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p2-q4",
        "section": "II",
        "type": "truefalse",
        "number": 4,
        "text": "Trong không gian với hệ tọa độ Oxyz, một trạm thu phát sóng điện thoại di động đặt tại I(−3;5;2) có bán kính phủ sóng 4 km. Mỗi đơn vị trên trục ứng với 1 km.",
        "statements": [
          {
            "text": "Phương trình mặt cầu mô tả ranh giới bên ngoài vùng phủ sóng là (x+3)²+(y−5)²+(z−2)²=16.",
            "answer": true
          },
          {
            "text": "Khoảng cách xa nhất giữa hai điểm thuộc vùng phủ sóng là 8 km.",
            "answer": true
          },
          {
            "text": "Người dùng điện thoại ở vị trí A(−3;4;1) không thể sử dụng dịch vụ.",
            "answer": false
          },
          {
            "text": "Người dùng ở vị trí B(2;6;2) có khoảng cách ngắn nhất tới vùng phủ sóng là 5,1 km.",
            "answer": false
          }
        ],
        "explanation": "Mặt cầu tâm I bán kính 4 nên phương trình trên đúng và đường kính 8 km. A có IA=√2<4 nên dùng được. B có IB=√26≈5,10, nên khoảng cách ngắn nhất tới vùng là √26−4≈1,1 km, không phải 5,1 km.",
        "sourcePage": 11,
        "topic": "Hình học Oxyz",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p3-q1",
        "section": "III",
        "type": "short",
        "number": 1,
        "text": "Trong không gian với hệ tọa độ Oxyz, xét đường thẳng đi qua điểm M(3;1;1), nằm trong mặt phẳng (α): x+y−z−3=0. Khi tạo với đường thẳng (d): x=1, y=4+3t, z=−3−2t một góc nhỏ nhất thì đường thẳng có một vectơ chỉ phương là (5;b;c). Giá trị của b+c bằng bao nhiêu?",
        "answer": "-3",
        "acceptedAnswers": [
          "-3"
        ],
        "explanation": "Chiếu vectơ của d lên mặt phẳng α và chuẩn hóa theo hoành độ 5 cho vectơ chỉ phương (5,−4,1), nên b+c=−3.",
        "sourcePage": 12,
        "topic": "Hình học Oxyz",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p3-q2",
        "section": "III",
        "type": "short",
        "number": 2,
        "text": "Một xưởng gia công đồ mỹ nghệ dự định sản xuất không quá 150 sản phẩm mỗi tháng. Chi phí sản xuất x sản phẩm là C(x)=5000+800x−3,6x²+0,004x³ (nghìn đồng). Giá bán mỗi sản phẩm là p(x)=2000−9x (nghìn đồng). Biết sản phẩm sản xuất ra được tiêu thụ hết. Lợi nhuận lớn nhất mỗi tháng mà xưởng thu được là bao nhiêu triệu đồng?",
        "answer": "57",
        "acceptedAnswers": [
          "57"
        ],
        "explanation": "Lợi nhuận (nghìn đồng) là x(2000−9x)−C(x). Tính đạo hàm, nghiệm cực đại trong miền 1≤x≤150 là x=100, cho lợi nhuận 57 000 nghìn đồng = 57 triệu đồng.",
        "sourcePage": 12,
        "topic": "Tối ưu hóa - Đạo hàm",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p3-q3",
        "section": "III",
        "type": "short",
        "number": 3,
        "text": "Một bãi đậu xe ô tô kinh doanh dịch vụ giữ xe ô tô qua đêm có diện tích 200 m² (không tính phần diện tích lối đi cho xe ra vào). Mỗi xe ô tô loại 7 chỗ cần diện tích 10 m² và mỗi xe ô tô loại 16 chỗ cần diện tích 20 m². Chi phí gửi xe mỗi đêm đối với xe loại 7 chỗ là 150 nghìn đồng và xe loại 16 chỗ là 200 nghìn đồng. Bãi đậu xe không thể chứa quá 20 xe một đêm. Sau mỗi đêm, doanh thu lớn nhất từ việc kinh doanh dịch vụ trên là bao nhiêu nghìn đồng?",
        "answer": "3000",
        "acceptedAnswers": [
          "3000"
        ],
        "explanation": "Gọi x,y lần lượt là số xe 7 chỗ và 16 chỗ. Ta có 10x+20y≤200 và x+y≤20. Doanh thu R=150x+200y. Với 20 xe, diện tích buộc phải là 10·20=200 khi y=0; đổi một xe 7 chỗ thành xe 16 chỗ tăng doanh thu 50 nhưng tăng thêm 10 m², nên điểm cực đại phù hợp là x=20,y=0, cho R=20·150=3000 nghìn đồng.",
        "sourcePage": 12,
        "topic": "Quy hoạch tuyến tính",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p3-q4",
        "section": "III",
        "type": "short",
        "number": 4,
        "text": "Gọi X là tập hợp gồm các số tự nhiên có 7 chữ số đôi một khác nhau. Lấy ngẫu nhiên một số từ tập X. Xác suất để lấy được một số chẵn chứa các chữ số 2,3,4 sao cho chữ số 2 đứng trước chữ số 3 và chữ số 3 đứng trước chữ số 4 là a/b, trong đó a,b là hai số nguyên dương và a/b là phân số tối giản. Giá trị a+b bằng bao nhiêu?",
        "answer": "2009",
        "acceptedAnswers": [
          "2009"
        ],
        "explanation": "Có 9·9·8·7·6·5·4=544320 số tự nhiên 7 chữ số đôi một khác nhau. Đếm các số chẵn chứa 2,3,4 với thứ tự 2 trước 3 trước 4 cho 18200 số. Rút gọn 18200/544320=65/1944 nên a+b=2009.",
        "sourcePage": 12,
        "topic": "Tổ hợp - Xác suất",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p3-q5",
        "section": "III",
        "type": "short",
        "number": 5,
        "text": "Một công ty thiết kế một bảng quảng cáo hình chữ nhật kích thước 10m×6m. Phần tô đậm được giới hạn bởi các đường cong thuộc đồ thị hàm số dạng (ax+b)/(cx+d), biết khoảng cách từ điểm A đến các tiệm cận đứng và ngang bằng 3m, đồ thị cắt cạnh AB tại E và AE/AB=5/10. Diện tích phần nội dung quảng cáo là bao nhiêu mét vuông? (Làm tròn đến hàng phần mười).",
        "answer": "45.1",
        "acceptedAnswers": [
          "45.1"
        ],
        "explanation": "Từ các điều kiện suy ra hai tiệm cận x=3, y=3 và đồ thị qua E=(4,0), nên y=3−3/(x−3). Tính diện tích phần tô đậm theo hai tích phân trên bảng 10×6 được khoảng 45,1 m².",
        "sourcePage": 12,
        "topic": "Ứng dụng tích phân",
        "reviewRequired": false
      },
      {
        "id": "math-2026-lamdong-p3-q6",
        "section": "III",
        "type": "short",
        "number": 6,
        "text": "Cho hình chóp S.ABCD có đáy là hình vuông tâm O. Biết SO vuông góc (ABCD), SO=√3 và đường tròn ngoại tiếp đáy có bán kính 1. Gọi M là trung điểm của cạnh SB. Khoảng cách từ M đến mặt phẳng (SCD) là √(m/n), với m,n nguyên dương, phân số tối giản. Giá trị m−n bằng bao nhiêu?",
        "answer": "-4",
        "acceptedAnswers": [
          "-4"
        ],
        "explanation": "Đáy là hình vuông bán kính ngoại tiếp 1 nên cạnh √2. Chọn hệ tọa độ đối xứng, tính khoảng cách từ M đến (SCD) được √(3/7), do đó m−n=3−7=−4.",
        "sourcePage": 13,
        "topic": "Khoảng cách trong không gian",
        "reviewRequired": false
      }
    ],
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.5
    },
    "originUrl": "https://dolthpt.vn/"
  },
  {
    "id": "exam-sinh-dien-bien-2026-0401",
    "program": "2k9",
    "subject": "biology",
    "grade": "12",
    "year": "2026",
    "examType": "thi-thu",
    "examPeriod": "Mã đề 0401",
    "examSession": "Sở GD&ĐT Điện Biên",
    "periodLabel": "Thi thử tốt nghiệp THPT • Mã đề 0401 • 2026",
    "title": "Sinh học 12 • Đề thi thử tốt nghiệp THPT Sở GD&ĐT Điện Biên 2026 – Mã đề 0401",
    "source": "Sở GD&ĐT Điện Biên • Đề thi thử tốt nghiệp THPT năm 2026 – Mã đề 0401",
    "sourceFile": "/exam-sources/dien-bien-sinh-2026-ma-0401.pdf",
    "duration": 50,
    "questions": [
      {
        "id": "bio-2026-dienbien-0401-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "text": "Hình bên là phả hệ mô tả về một bệnh di truyền ở người. Hãy cho biết phát biểu nào dưới đây có thể giải thích đúng cơ sở di truyền của bệnh ở phả hệ trên?",
        "options": [
          "Bệnh do allele lặn nằm trên NST giới tính X không có allele tương ứng trên NST Y quy định.",
          "Bệnh do allele trội nằm trên NST thường quy định.",
          "Bệnh do allele lặn nằm trên NST thường quy định.",
          "Bệnh do allele trội nằm trên NST giới tính X không có allele tương ứng trên NST Y quy định."
        ],
        "answer": "B",
        "explanation": "Phả hệ có người bệnh ở cả nam và nữ, xuất hiện liên tục qua nhiều thế hệ, phù hợp kiểu di truyền trội trên NST thường.",
        "sourcePage": 2,
        "topic": "Di truyền người - Phả hệ",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "text": "Phát biểu nào sau đây không đúng khi nói về nucleic acid?",
        "options": [
          "DNA có cấu tạo 2 mạch, còn RNA có 1 mạch.",
          "Liên kết hydrogen chỉ có ở DNA.",
          "RNA có nucleotide loại U, còn DNA có nucleotide loại T.",
          "RNA được chia thành 3 loại dựa theo chức năng."
        ],
        "answer": "B",
        "explanation": "RNA cũng có liên kết hydrogen trong cấu trúc phù hợp, nên nói liên kết hydrogen chỉ có ở DNA là sai.",
        "sourcePage": 3,
        "topic": "Cơ chế di truyền phân tử",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "text": "Trong điều trị SCID do đột biến gene ADA, sử dụng vector chuyển gene ADA bình thường vào tế bào gốc tủy. Liệu pháp gene được dùng là gì?",
        "options": [
          "Đưa gene bình thường vào cơ thể người bệnh để phá hủy gene đột biến.",
          "Đưa gene bình thường vào cơ thể người bệnh để chỉnh sửa gene đột biến.",
          "Đưa gene bình thường vào cơ thể người bệnh để tạo enzyme hoạt động.",
          "Đưa gene bình thường vào cơ thể người bệnh để ức chế biểu hiện của gene đột biến."
        ],
        "answer": "C",
        "explanation": "Gene ADA bình thường được bổ sung để tế bào tổng hợp enzyme ADA hoạt động.",
        "sourcePage": 3,
        "topic": "Công nghệ gene",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "text": "Đặc trưng nào dưới đây không phải của quần thể?",
        "options": [
          "Nhóm tuổi",
          "Mật độ cá thể",
          "Tỉ lệ giới tính",
          "Thành phần loài"
        ],
        "answer": "D",
        "explanation": "Thành phần loài là đặc trưng của quần xã, không phải quần thể.",
        "sourcePage": 4,
        "topic": "Sinh thái học quần thể",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "text": "Cho chuỗi thức ăn: Tảo lục đơn bào → Tôm → Cá rô → Chim bói cá. Có bao nhiêu loài thuộc sinh vật tiêu thụ?",
        "options": [
          "2",
          "3",
          "1",
          "4"
        ],
        "answer": "B",
        "explanation": "Tôm, cá rô và chim bói cá là 3 loài tiêu thụ.",
        "sourcePage": 4,
        "topic": "Sinh thái học quần xã",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "text": "Trong hô hấp hiếu khí ở thực vật, giai đoạn nào giải phóng ra khí carbon dioxide?",
        "options": [
          "Đường phân",
          "Chuỗi truyền electron",
          "Lên men",
          "Oxy hóa pyruvate và chu trình Krebs"
        ],
        "answer": "D",
        "explanation": "CO2 được giải phóng trong oxy hóa pyruvate và chu trình Krebs.",
        "sourcePage": 4,
        "topic": "Sinh lí thực vật",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q7",
        "section": "I",
        "type": "mcq",
        "number": 7,
        "text": "Khi khảo sát sơ đồ kiểu nhân (karyotype) về số lượng NST ở các tế bào soma của một loài thực vật (đối chiếu trang 5 PDF gốc: Tế bào 2 có một cặp NST thừa 1 chiếc tạo bộ 2n+1). Tế bào nào sau đây thuộc đột biến lệch bội dạng thể ba?",
        "options": [
          "Tế bào 2",
          "Tế bào 3",
          "Tế bào 1",
          "Tế bào 4"
        ],
        "answer": "A",
        "explanation": "Thể ba (2n + 1) có một cặp NST tương đồng có 3 chiếc thay vì 2 chiếc; trên sơ đồ kiểu nhân trang 5 đề gốc tương ứng với Tế bào 2.",
        "sourcePage": 5,
        "reviewRequired": false,
        "topic": "Đột biến nhiễm sắc thể"
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q8",
        "section": "I",
        "type": "mcq",
        "number": 8,
        "text": "Quan sát hình bên và cho biết tế bào đang ở giai đoạn nào của quá trình phân bào và bộ NST lưỡng bội của loài bằng bao nhiêu?",
        "options": [
          "Tế bào đang ở kì giữa của nguyên phân, 2n=10.",
          "Tế bào đang ở kì giữa của giảm phân II, 2n=10.",
          "Tế bào đang ở kì giữa của giảm phân I, 2n=5.",
          "Tế bào đang ở kì giữa của nguyên phân, 2n=5."
        ],
        "answer": "B",
        "explanation": "Dạng hình tương ứng kì giữa giảm phân II của loài có 2n=10.",
        "sourcePage": 5,
        "topic": "Phân bào",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q9",
        "section": "I",
        "type": "mcq",
        "number": 9,
        "text": "Cho các bước nghiên cứu: (1) Quan sát thu thập dữ liệu; (2) Kiểm chứng giả thuyết bằng thực nghiệm; (3) Hình thành giả thuyết khoa học. Quy trình nghiên cứu khoa học của Darwin theo trình tự:",
        "options": [
          "(1) → (2) → (3)",
          "(3) → (2) → (1)",
          "(1) → (3) → (2)",
          "(2) → (1) → (3)"
        ],
        "answer": "C",
        "explanation": "Quan sát, hình thành giả thuyết, rồi kiểm chứng bằng thực nghiệm.",
        "sourcePage": 5,
        "topic": "Tiến hóa",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q10",
        "section": "I",
        "type": "mcq",
        "number": 10,
        "text": "Theo thuyết tiến hóa hiện đại, hiện tượng phát tán hạt giữa các quần thể thực vật cùng loài dẫn đến làm thay đổi vốn gene được gọi là",
        "options": [
          "chọn lọc tự nhiên",
          "giao phối không ngẫu nhiên",
          "dòng gene",
          "đột biến"
        ],
        "answer": "C",
        "explanation": "Sự di chuyển allele giữa các quần thể là dòng gene.",
        "sourcePage": 6,
        "topic": "Các nhân tố tiến hóa",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q11",
        "section": "I",
        "type": "mcq",
        "number": 11,
        "text": "Con người đã áp dụng kiến thức sinh học như thế nào để giảm thiểu rủi ro do biến đổi khí hậu?",
        "options": [
          "Tập trung vào việc xây dựng các chính sách công nghệ cao.",
          "Bảo tồn đa dạng sinh học, cải tạo hệ sinh thái, tăng sự thích ứng.",
          "Dựa vào các thành tựu khoa học công nghệ để đối phó với khí hậu.",
          "Trồng cây xanh để thay thế toàn bộ rừng tự nhiên trên toàn cầu."
        ],
        "answer": "B",
        "explanation": "Bảo tồn đa dạng sinh học, cải tạo hệ sinh thái và tăng khả năng thích ứng là hướng tiếp cận phù hợp.",
        "sourcePage": 6,
        "topic": "Sinh thái & Biến đổi khí hậu",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q12",
        "section": "I",
        "type": "mcq",
        "number": 12,
        "text": "Một đoạn mạch khuôn của gene ở vi khuẩn có trình tự 5’…TGG-CTT-CCA-AAC…3’. Theo lí thuyết, đoạn polypeptide có trình tự amino acid là",
        "options": [
          "Val – Lys – Trp – Pro",
          "Val – Trp – Lys – Pro",
          "Pro – Lys – Trp – Val",
          "Pro – Trp – Lys – Val"
        ],
        "answer": "B",
        "explanation": "Mạch khuôn cho mRNA bổ sung, rồi đọc theo chiều 5’→3’ cho chuỗi Val – Trp – Lys – Pro.",
        "sourcePage": 6,
        "topic": "Phiên mã & Dịch mã",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q13",
        "section": "I",
        "type": "mcq",
        "number": 13,
        "text": "Ở một loài thực vật 2n, tạo giao tử bất thường 2n dẫn đến cá thể 4n; các cá thể 4n giao phấn với nhau và cách li sinh sản với quần thể 2n trong cùng khu vực. Đây là hình thành loài",
        "options": [
          "cùng khu vực địa lí",
          "bằng con đường lai xa và đa bội hóa",
          "bằng cách li tập tính",
          "khác khu vực địa lí"
        ],
        "answer": "A",
        "explanation": "Đây là hình thành loài cùng khu vực địa lí do đa bội hóa tạo cách li sinh sản.",
        "sourcePage": 7,
        "topic": "Hình thành loài",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q14",
        "section": "I",
        "type": "mcq",
        "number": 14,
        "text": "Dịch mạch gỗ bao gồm những thành phần chủ yếu nào?",
        "options": [
          "Nước và các ion khoáng",
          "Amino acid và vitamin",
          "Sucrose và hormone",
          "Cytokinin và alkaloid"
        ],
        "answer": "A",
        "explanation": "Mạch gỗ chủ yếu vận chuyển nước và ion khoáng.",
        "sourcePage": 7,
        "topic": "Sinh lí thực vật",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q15",
        "section": "I",
        "type": "mcq",
        "number": 15,
        "text": "Hươu cao cổ có cổ dài hơn nhiều loài thú khác, nhưng cũng chỉ có 7 đốt sống cổ như người và tất cả loài thú khác. Đây là bằng chứng tiến hóa nào?",
        "options": [
          "Sinh học phân tử",
          "Giải phẫu so sánh",
          "Hóa thạch",
          "Tế bào học"
        ],
        "answer": "B",
        "explanation": "So sánh số lượng và cấu trúc đốt sống là bằng chứng giải phẫu so sánh.",
        "sourcePage": 7,
        "topic": "Bằng chứng tiến hóa",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q16",
        "section": "I",
        "type": "mcq",
        "number": 16,
        "text": "Phản ứng trùng ngưng làm liên kết các phân tử nhỏ (đơn phân) thành các đại phân tử là một giai đoạn của quá trình",
        "options": [
          "Tiến hóa lớn",
          "Tiến hóa tiền sinh học",
          "Tiến hóa hóa học",
          "Tiến hóa sinh học"
        ],
        "answer": "C",
        "explanation": "Trùng ngưng tạo các chất hữu cơ phức tạp thuộc giai đoạn tiến hóa hóa học.",
        "sourcePage": 7,
        "topic": "Sự phát sinh sự sống",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q17",
        "section": "I",
        "type": "mcq",
        "number": 17,
        "text": "Trong quy trình công nghệ gene tạo sinh vật biến đổi gene (trang 8 PDF gốc), giai đoạn dùng enzyme cắt giới hạn (restrictase) và enzyme nối (ligase) để gắn gene cần chuyển vào thể truyền (plasmid) được gọi là gì?",
        "options": [
          "Tạo ra sinh vật mang gene biến đổi",
          "Tạo plasmid",
          "Tạo thể truyền",
          "Tạo DNA tái tổ hợp"
        ],
        "answer": "D",
        "explanation": "Giai đoạn cắt và nối DNA tế bào cho với plasmid vector bằng enzyme restrictase và ligase là giai đoạn tạo DNA tái tổ hợp.",
        "sourcePage": 8,
        "reviewRequired": false,
        "topic": "Công nghệ gene"
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q18",
        "section": "I",
        "type": "mcq",
        "number": 18,
        "text": "Trong một quần xã sinh vật, nhóm loài nào sau đây thường đóng vai trò là loài chủ chốt?",
        "options": [
          "Thực vật",
          "Sinh vật phân giải",
          "Động vật ăn thịt bậc cao",
          "Động vật ăn thực vật"
        ],
        "answer": "C",
        "explanation": "Loài chủ chốt thường có ảnh hưởng lớn đến cấu trúc quần xã, điển hình là động vật ăn thịt bậc cao.",
        "sourcePage": 8,
        "topic": "Sinh thái học quần xã",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "text": "Thực hiện thí nghiệm tổng hợp nhân tạo trong 3 ống nghiệm X, Y, Z tương ứng với các quá trình: Tái bản DNA (ống I), Phiên mã (ống II) và Dịch mã (ống III). Xét các nhận định sau:",
        "statements": [
          {
            "text": "Các ống nghiệm X, Y, Z lần lượt tương ứng với các ống nghiệm III, II, I.",
            "answer": true
          },
          {
            "text": "Trong ống III, nếu cả 20 amino acid tự do được sử dụng để dịch mã thì chỉ có 20 loại tRNA được huy động.",
            "answer": false
          },
          {
            "text": "Nếu gene Q dài bằng gene P nhưng có tỉ lệ (A+T)/(G+C) lớn hơn thì nhiệt độ tách hoàn toàn hai mạch Q lớn hơn P.",
            "answer": false
          },
          {
            "text": "Muốn thu được đột biến gene với tần số cao thì nên sử dụng tác nhân gây đột biến tác động vào ống nghiệm Z.",
            "answer": true
          }
        ],
        "explanation": "Ống Z là tái bản DNA; tỉ lệ AT cao làm nhiệt độ nóng chảy thấp hơn, không cao hơn. Khi dịch mã có thể dùng nhiều tRNA hơn số loại amino acid.",
        "sourcePage": 9,
        "table": [
          [
            "Ống nghiệm",
            "I",
            "II",
            "III"
          ],
          [
            "Quá trình",
            "Tái bản DNA",
            "Phiên mã",
            "Dịch mã"
          ]
        ],
        "topic": "Cơ chế di truyền phân tử",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q2",
        "section": "II",
        "type": "truefalse",
        "number": 2,
        "text": "Khảo sát sự biến động quần thể nai sừng tấm và sự phục hồi hệ sinh thái rừng Vườn quốc gia Yellowstone trước và sau khi tái nhập sói xám năm 1995 (trang 9 PDF gốc). Xét các nhận định sau:",
        "statements": [
          {
            "text": "Việc tái nhập sói xám năm 1995 đã bắt đầu có tác động tích cực đến sự phục hồi hệ sinh thái rừng.",
            "answer": true
          },
          {
            "text": "Tốc độ phục hồi thực vật tỉ lệ thuận và xảy ra đồng thời với tốc độ giảm số lượng nai ngay sau khi thả sói.",
            "answer": false
          },
          {
            "text": "Trong giai đoạn 1926–1968, quần thể nai biến động hoàn toàn theo quy luật tự nhiên và phụ thuộc nguồn thức ăn.",
            "answer": false
          },
          {
            "text": "Sự vắng mặt của sói xám là nguyên nhân gián tiếp dẫn đến suy giảm nghiêm trọng khả năng tái sinh thực vật giai đoạn 1926–1990.",
            "answer": true
          }
        ],
        "explanation": "Sau tái nhập sói, nai giảm rồi thực vật phục hồi với độ trễ. Giai đoạn trước đó còn chịu tác động của con người nên không thể coi hoàn toàn tự nhiên.",
        "sourcePage": 9,
        "topic": "Sinh thái học quần xã",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q3",
        "section": "II",
        "type": "truefalse",
        "number": 3,
        "text": "Phân tích sơ đồ hệ tuần hoàn máu ở người và đồ thị biến đổi huyết áp từ tâm thất trái (3) qua động mạch chủ (B), tiểu động mạch (C) đến mao mạch và tĩnh mạch (trang 10 PDF gốc). Xét các nhận định sau:",
        "statements": [
          {
            "text": "Các cấu trúc (1),(2),(3),(4) lần lượt là tâm nhĩ trái, tâm nhĩ phải, tâm thất phải, tâm thất trái.",
            "answer": false
          },
          {
            "text": "Nếu hở van giữa buồng (2) và (3) thì huyết áp tối đa tại mạch B có thể thấp hơn 120 mmHg.",
            "answer": true
          },
          {
            "text": "Áp lực máu sụt giảm mạnh nhất từ C đến mao mạch là do vận tốc máu tại khu vực này thấp nhất.",
            "answer": false
          },
          {
            "text": "Ở mạch B, áp lực máu không tụt sâu về 0 mmHg trong kỳ tâm trương như ở buồng tim (3) là do tính đàn hồi thành mạch.",
            "answer": true
          }
        ],
        "explanation": "Theo sơ đồ tuần hoàn và cơ chế huyết áp: a sai do quy ước vị trí buồng tim; b đúng; c sai vì áp lực giảm mạnh do tổng tiết diện và sức cản, không phải đơn thuần vận tốc; d đúng do tính đàn hồi thành mạch.",
        "sourcePage": 10,
        "topic": "Sinh lí động vật - Tuần hoàn",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q4",
        "section": "II",
        "type": "truefalse",
        "number": 4,
        "text": "Ở một loài thực vật, xét phép lai phân tích cá thể dị hợp hai cặp gene (P, Q) nhằm xác định quy luật di truyền và tần số hoán vị gene (trang 10 PDF gốc). Xét các nhận định sau:",
        "statements": [
          {
            "text": "Nếu Fa xuất hiện 4 kiểu hình và kiểu hình giống bố,mẹ chiếm tỉ lệ lớn hơn, chứng tỏ P,Q đã xảy ra hoán vị gene.",
            "answer": true
          },
          {
            "text": "Nếu Fa xuất hiện 2 kiểu hình, chứng tỏ P,Q cùng nằm trên 1 NST và liên kết hoàn toàn.",
            "answer": false
          },
          {
            "text": "Nếu Fa xuất hiện 4 kiểu hình bằng nhau, chứng tỏ P,Q phải nằm trên các NST khác nhau.",
            "answer": false
          },
          {
            "text": "Nếu Fa xuất hiện 4 kiểu hình với tỉ lệ 41%:41%:9%:9% thì khoảng cách giữa P,Q là 18 cM.",
            "answer": true
          }
        ],
        "explanation": "Hai ý đầu không đủ để kết luận tuyệt đối; tỉ lệ 41:41:9:9 cho tần số hoán vị 18%, nên d đúng.",
        "sourcePage": 10,
        "topic": "Quy luật di truyền Morgan",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q1",
        "section": "III",
        "type": "short",
        "number": 1,
        "text": "Cú ăn chuột nhắt, chuột chù và các loài chim nhỏ. Tổng năng lượng con mồi cung cấp là 5000 J; cú mất 2300 J trong phân và sử dụng 2500 J cho hô hấp tế bào. Hiệu suất sinh thái là bao nhiêu phần trăm?",
        "answer": "4",
        "acceptedAnswers": [
          "4"
        ],
        "explanation": "Năng lượng đồng hóa=5000−2300=2700 J; sinh khối tích lũy=2700−2500=200 J; hiệu suất=200/5000×100%=4%.",
        "sourcePage": 12,
        "topic": "Hiệu suất sinh thái",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q2",
        "section": "III",
        "type": "short",
        "number": 2,
        "text": "Bảng thay đổi tỉ lệ sinh, tử vong, xuất cư, nhập cư của quần thể động vật. Năm 1990 tỉ lệ sinh 2,0%, tử vong 1,2%, xuất cư 0,5%, nhập cư 0,9%. Tỉ lệ tăng trưởng năm 1990 là bao nhiêu phần trăm?",
        "answer": "1.2",
        "acceptedAnswers": [
          "1.2"
        ],
        "explanation": "r=2,0−1,2−0,5+0,9=1,2%.",
        "sourcePage": 12,
        "topic": "Sinh thái học quần thể",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q3",
        "section": "III",
        "type": "short",
        "number": 3,
        "text": "Trên sơ đồ cấu trúc Operon Lac và vùng điều hòa ở vi khuẩn E. coli (trang 12 PDF gốc, đánh số tuần tự từ vùng gene điều hòa lacI ở vị trí số 1 → vùng P → vùng O → nhóm gene cấu trúc Z, Y, A). Gene điều hòa (lacI) nằm ở vị trí tương ứng với số mấy?",
        "answer": "1",
        "acceptedAnswers": [
          "1"
        ],
        "explanation": "Gene điều hòa (lacI) nằm trước vùng khởi động (P) của operon, ứng với vị trí số 1 trên sơ đồ.",
        "sourcePage": 12,
        "reviewRequired": false,
        "topic": "Điều hòa hoạt động gene (Operon Lac)"
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q4",
        "section": "III",
        "type": "short",
        "number": 4,
        "text": "Quần thể sóc ở Cúc Phương cân bằng di truyền; allele A có tần số gấp đôi allele a. Tất cả cá thể dị hợp không sinh sản. Thế hệ sau kiểu hình lông hung chiếm bao nhiêu phần trăm?",
        "answer": "80",
        "acceptedAnswers": [
          "80"
        ],
        "explanation": "p(A)=2/3,q(a)=1/3; trước chọn lọc AA=4/9,Aa=4/9,aa=1/9. Bỏ Aa, chuẩn hóa AA:aa=4:1, nên kiểu hình hung=4/5=80%.",
        "sourcePage": 12,
        "topic": "Di truyền quần thể",
        "reviewRequired": false
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q5",
        "section": "III",
        "type": "short",
        "number": 5,
        "text": "Cho các phát biểu về cây phát sinh chủng loại của 5 nhóm sinh vật (trang 12 PDF gốc): (1) Các nhóm sinh vật đều có chung nguồn gốc; (2) Nhóm Rêu xuất hiện muộn nhất; (3) Thực vật có quan hệ họ hàng gần với Nấm hơn so với Vi khuẩn; (4) Tổ tiên chung xuất hiện cùng lúc với các loài hiện tại; (5) Sự đa dạng các nhóm là kết quả của quá trình tiến hóa. Hãy viết liền các số tương ứng với phát biểu đúng theo thứ tự từ nhỏ đến lớn.",
        "answer": "135",
        "acceptedAnswers": [
          "135"
        ],
        "explanation": "Theo mô tả cây nguồn: nhóm có chung nguồn gốc; thực vật gần nấm; và phát sinh các nhóm là kết quả của tiến hóa. Hai phát biểu về thời điểm xuất hiện tuyệt đối không được suy ra như đã nêu.",
        "sourcePage": 12,
        "reviewRequired": false,
        "topic": "Tiến hóa & Phát sinh chủng loại"
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q6",
        "section": "III",
        "type": "short",
        "number": 6,
        "text": "Ở ruồi giấm, gene màu thân và chiều dài cánh cùng nằm trên một NST và cách nhau 40 cM. Cho ruồi cái F1 lai với ruồi thân đen, cánh cụt. Kiểu hình thân xám, cánh cụt chiếm tỉ lệ bao nhiêu?",
        "answer": "20",
        "acceptedAnswers": [
          "20"
        ],
        "explanation": "Tần số hoán vị 40%, mỗi loại giao tử tái tổ hợp chiếm 20%. Kiểu hình xám, cụt ứng với giao tử Ab nên chiếm 20%.",
        "sourcePage": 12,
        "topic": "Hoán vị gene",
        "reviewRequired": false
      }
    ],
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.25
    },
    "originUrl": "https://dolthpt.vn/tot-nghiep-thpt/pdf-de-thi-thu-tot-nghiep-thpt-mon-sinh-hoc-so-gd-dt-dien-bien-nam-2026-ma-de-0401-co-dap-an"
  },
  {
    "id": "exam-toan-ngogiatu-hk2-2026",
    "program": "2k9",
    "subject": "math",
    "grade": "12",
    "year": "2026",
    "examType": "hoc-ky",
    "examPeriod": "Học kỳ II",
    "examSession": "THPT số 1 Ngô Gia Tự – Đắk Lắk",
    "periodLabel": "Kiểm tra Học kỳ II • 2025–2026 • Đề trường công bố",
    "title": "Toán 12 • Đề kiểm tra Học kỳ II Trường THPT số 1 Ngô Gia Tự (Đắk Lắk) 2025–2026",
    "source": "Trường THPT số 1 Ngô Gia Tự – Đắk Lắk • Bộ đề & đáp án HK2 Khối 12 năm học 2025–2026",
    "sourceFile": "https://drive.google.com/drive/folders/1n0_eyxbgb4YuK4et8TLjf0hWCNgUwwD0?usp=sharing",
    "originUrl": "https://thpt-ngogiatu-daklak.edu.vn/khoi-12-de-va-dap-an-kiem-tra-cuoi-hoc-ky-ii-nam-hoc-2025-2026.htm",
    "duration": 90,
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.5
    },
    "questions": [
      {
        "id": "math-ngt-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "topic": "Nguyên hàm - Tích phân",
        "text": "Họ tất cả các nguyên hàm của hàm số $f(x) = 3x^2 - 2\\cos x$ là",
        "options": [
          "$x^3 - 2\\sin x + C$",
          "$x^3 + 2\\sin x + C$",
          "$6x + 2\\sin x + C$",
          "$3x^3 - 2\\sin x + C$"
        ],
        "answer": "A",
        "explanation": "Áp dụng công thức nguyên hàm cơ bản: $\\int (3x^2 - 2\\cos x)dx = x^3 - 2\\sin x + C$."
      },
      {
        "id": "math-ngt-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "topic": "Nguyên hàm - Tích phân",
        "text": "Biết $\\int_0^2 f(x)dx = 5$ và $\\int_0^2 g(x)dx = -3$. Giá trị của $\\int_0^2 [2f(x) - 3g(x)]dx$ bằng",
        "options": [
          "1",
          "19",
          "16",
          "-1"
        ],
        "answer": "B",
        "explanation": "Theo tính chất tuyến tính của tích phân: $2\\int_0^2 f(x)dx - 3\\int_0^2 g(x)dx = 2(5) - 3(-3) = 10 + 9 = 19$."
      },
      {
        "id": "math-ngt-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "topic": "Ứng dụng tích phân",
        "text": "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi đồ thị hàm số $y = \\sqrt{x}$, trục hoành và hai đường thẳng $x = 0, x = 4$ quanh trục $Ox$ là",
        "options": [
          "$8\\pi$",
          "$8$",
          "$16\\pi$",
          "$4\\pi$"
        ],
        "answer": "A",
        "explanation": "Công thức thể tích: $V = \\pi \\int_0^4 (\\sqrt{x})^2 dx = \\pi \\int_0^4 x dx = \\pi \\left[\\frac{x^2}{2}\\right]_0^4 = 8\\pi$."
      },
      {
        "id": "math-ngt-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "topic": "Hình học Oxyz",
        "text": "Trong không gian $Oxyz$, cho mặt phẳng $(P): 2x - 3y + 6z - 14 = 0$. Khoảng cách từ điểm $M(1; -2; 3)$ đến mặt phẳng $(P)$ bằng",
        "options": [
          "$\\frac{12}{7}$",
          "$\\frac{26}{7}$",
          "$2$",
          "$\\frac{14}{7}$"
        ],
        "answer": "A",
        "explanation": "Áp dụng công thức khoảng cách: $d(M,(P)) = \\frac{|2(1) - 3(-2) + 6(3) - 14|}{\\sqrt{2^2 + (-3)^2 + 6^2}} = \\frac{|2 + 6 + 18 - 14|}{7} = \\frac{12}{7}$."
      },
      {
        "id": "math-ngt-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "topic": "Hình học Oxyz",
        "text": "Trong không gian $Oxyz$, đường thẳng $d: \\frac{x-1}{2} = \\frac{y+2}{-1} = \\frac{z-3}{4}$ đi qua điểm nào dưới đây?",
        "options": [
          "$A(1; -2; 3)$",
          "$B(-1; 2; -3)$",
          "$C(2; -1; 4)$",
          "$D(1; 2; 3)$"
        ],
        "answer": "A",
        "explanation": "Thay tọa độ $A(1; -2; 3)$ vào phương trình chính tắc của $d$ ta được $\\frac{0}{2} = \\frac{0}{-1} = \\frac{0}{4} = 0$ (luôn đúng)."
      },
      {
        "id": "math-ngt-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "topic": "Hình học Oxyz",
        "text": "Phương trình mặt cầu tâm $I(2; -1; 3)$ và đi qua điểm $A(4; 1; 2)$ là",
        "options": [
          "$(x-2)^2 + (y+1)^2 + (z-3)^2 = 9$",
          "$(x+2)^2 + (y-1)^2 + (z+3)^2 = 9$",
          "$(x-2)^2 + (y+1)^2 + (z-3)^2 = 3$",
          "$(x-4)^2 + (y-1)^2 + (z-2)^2 = 9$"
        ],
        "answer": "A",
        "explanation": "Bán kính $R = IA = \\sqrt{(4-2)^2 + (1+1)^2 + (2-3)^2} = \\sqrt{4+4+1} = 3 \\Rightarrow R^2 = 9$."
      },
      {
        "id": "math-ngt-p1-q7",
        "section": "I",
        "type": "mcq",
        "number": 7,
        "topic": "Xác suất có điều kiện",
        "text": "Cho hai biến cố $A$ và $B$ có $P(B) = 0,6$ và $P(A \\cap B) = 0,24$. Xác suất có điều kiện $P(A|B)$ bằng",
        "options": [
          "$0,4$",
          "$0,144$",
          "$0,36$",
          "$0,84$"
        ],
        "answer": "A",
        "explanation": "Theo định nghĩa xác suất có điều kiện: $P(A|B) = \\frac{P(A \\cap B)}{P(B)} = \\frac{0,24}{0,6} = 0,4$."
      },
      {
        "id": "math-ngt-p1-q8",
        "section": "I",
        "type": "mcq",
        "number": 8,
        "topic": "Khảo sát hàm số",
        "text": "Tiệm cận ngang của đồ thị hàm số $y = \\frac{3x - 1}{x + 2}$ là đường thẳng",
        "options": [
          "$y = 3$",
          "$x = -2$",
          "$y = -2$",
          "$y = -\\frac{1}{2}$"
        ],
        "answer": "A",
        "explanation": "Ta có $\\lim_{x \\to \\pm\\infty} \\frac{3x-1}{x+2} = 3$, suy ra tiệm cận ngang là $y = 3$."
      },
      {
        "id": "math-ngt-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "topic": "Nguyên hàm - Tích phân",
        "text": "Một vật chuyển động thẳng với vận tốc $v(t) = 12 - 3t$ (m/s), trong đó $t$ là thời gian tính bằng giây kể từ lúc vật bắt đầu chuyển động ($t \\ge 0$).",
        "statements": [
          {
            "text": "Tại thời điểm $t = 0$, vận tốc của vật bằng $12$ m/s.",
            "answer": true
          },
          {
            "text": "Vật dừng lại tại thời điểm $t = 3$ giây.",
            "answer": false
          },
          {
            "text": "Quãng đường vật đi được trong 4 giây đầu tiên là $24$ m.",
            "answer": true
          },
          {
            "text": "Quãng đường vật đi được từ giây thứ 2 đến giây thứ 6 là $12$ m.",
            "answer": true
          }
        ],
        "explanation": "a) Đúng vì $v(0)=12$. b) Sai vì $v(t)=0 \\Leftrightarrow 12-3t=0 \\Leftrightarrow t=4$ giây. c) Đúng vì $\\int_0^4 (12-3t)dt = [12t - 1,5t^2]_0^4 = 24$ m. d) Đúng vì quãng đường là $\\int_2^6 |12-3t|dt = 6 + 6 = 12$ m."
      },
      {
        "id": "math-ngt-p2-q2",
        "section": "II",
        "type": "truefalse",
        "number": 2,
        "topic": "Hình học Oxyz",
        "text": "Trong không gian $Oxyz$, cho điểm $A(1; 0; 2)$ và mặt phẳng $(P): x + 2y - 2z + 6 = 0$.",
        "statements": [
          {
            "text": "Vectơ $\\vec{n} = (1; 2; -2)$ là một vectơ pháp tuyến của mặt phẳng $(P)$.",
            "answer": true
          },
          {
            "text": "Điểm $A$ thuộc mặt phẳng $(P)$.",
            "answer": false
          },
          {
            "text": "Khoảng cách từ điểm $A$ đến mặt phẳng $(P)$ bằng $1$.",
            "answer": true
          },
          {
            "text": "Hình chiếu vuông góc của điểm $A$ lên mặt phẳng $(P)$ có hoành độ bằng $\\frac{2}{3}$.",
            "answer": true
          }
        ],
        "explanation": "a) Đúng. b) Thay $A(1;0;2)$ vào $(P)$: $1 + 0 - 4 + 6 = 3 \\neq 0$ nên $A \\notin (P)$. c) $d(A,(P)) = \\frac{|3|}{\\sqrt{1+4+4}} = 1$. d) Đường thẳng qua $A$ vuông góc $(P)$ có phương trình $x=1+t, y=2t, z=2-2t$; thay vào $(P)$ được $3+9t=0 \\Rightarrow t=-1/3$, nên $x_H = 1 - 1/3 = 2/3$."
      },
      {
        "id": "math-ngt-p3-q1",
        "section": "III",
        "type": "short",
        "number": 1,
        "topic": "Nguyên hàm - Tích phân",
        "text": "Cho hàm số $f(x)$ có đạo hàm $f'(x) = 4x^3 - 6x$ và $f(1) = 2$. Giá trị của $f(2)$ bằng bao nhiêu?",
        "answer": "8",
        "acceptedAnswers": [
          "8"
        ],
        "explanation": "Ta có $f(x) = \\int (4x^3 - 6x)dx = x^4 - 3x^2 + C$. Do $f(1) = 2 \\Rightarrow 1 - 3 + C = 2 \\Rightarrow C = 4$. Khi đó $f(2) = 2^4 - 3\\cdot 2^2 + 4 = 16 - 12 + 4 = 8$."
      },
      {
        "id": "math-ngt-p3-q2",
        "section": "III",
        "type": "short",
        "number": 2,
        "topic": "Xác suất có điều kiện",
        "text": "Một hộp thứ nhất có 4 bi đỏ và 6 bi xanh; hộp thứ hai có 7 bi đỏ và 3 bi xanh. Chọn ngẫu nhiên một hộp rồi từ hộp đó lấy ngẫu nhiên 1 viên bi. Xác suất lấy được viên bi màu đỏ bằng bao nhiêu? (Viết dưới dạng số thập phân).",
        "answer": "0.55",
        "acceptedAnswers": [
          "0.55",
          "0,55",
          "11/20"
        ],
        "explanation": "Theo công thức xác suất toàn phần: $P(\\text{Đỏ}) = 0,5 \\times \\frac{4}{10} + 0,5 \\times \\frac{7}{10} = 0,2 + 0,35 = 0,55$."
      },
      {
        "id": "math-ngt-p3-q3",
        "section": "III",
        "type": "short",
        "number": 3,
        "topic": "Hình học Oxyz",
        "text": "Trong không gian $Oxyz$, mặt cầu $(S): x^2 + y^2 + z^2 - 4x + 6y - 2z - 11 = 0$ có bán kính $R$ bằng bao nhiêu?",
        "answer": "5",
        "acceptedAnswers": [
          "5"
        ],
        "explanation": "Tâm $I(2; -3; 1)$, bán kính $R = \\sqrt{2^2 + (-3)^2 + 1^2 - (-11)} = \\sqrt{4 + 9 + 1 + 11} = \\sqrt{25} = 5$."
      },
      {
        "id": "math-ngt-p3-q4",
        "section": "III",
        "type": "short",
        "number": 4,
        "topic": "Ứng dụng tích phân",
        "text": "Tính diện tích hình phẳng giới hạn bởi đồ thị hàm số $y = x^2 - 4x + 3$ và trục hoành $Ox$ (làm tròn đến hai chữ số thập phân nếu cần, hoặc nhập phân số tối giản dạng a/b).",
        "answer": "4/3",
        "acceptedAnswers": [
          "4/3",
          "1.33",
          "1,33"
        ],
        "explanation": "Hoành độ giao điểm: $x^2-4x+3=0 \\Leftrightarrow x=1$ hoặc $x=3$. Diện tích $S = \\int_1^3 |x^2-4x+3|dx = \\frac{4}{3} \\approx 1,33$."
      }
    ]
  },
  {
    "id": "exam-vatli-quocgia-2026",
    "program": "2k9",
    "subject": "physics",
    "grade": "12",
    "year": "2026",
    "examType": "tot-nghiep",
    "examPeriod": "Kỳ thi THPT 2026",
    "examSession": "Bộ GD&ĐT / THPT Ngô Gia Tự",
    "periodLabel": "Đề luyện Tốt nghiệp THPT • Vật lí 12 • 2026",
    "title": "Vật lí 12 • Đề luyện thi Tốt nghiệp THPT 2026 – Chuẩn cấu trúc Bộ GD&ĐT",
    "source": "Tổng hợp từ nguồn Đề & Gợi ý đáp án Vật lí THPT 2026 (Cổng TTĐT Chính phủ & THPT số 1 Ngô Gia Tự)",
    "sourceFile": "https://xaydungchinhsach.chinhphu.vn/thi-tot-nghiep-thpt-2026-de-thi-mon-vat-li-va-goi-y-dap-an-119260612135353486.htm",
    "originUrl": "https://thpt-ngogiatu-daklak.edu.vn/khoi-12-de-va-dap-an-kiem-tra-cuoi-hoc-ky-ii-nam-hoc-2025-2026.htm",
    "duration": 50,
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.25
    },
    "questions": [
      {
        "id": "phy-2026-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "topic": "Vật lí nhiệt",
        "text": "Khi nhiệt độ của một vật tăng thêm $15^\\circ\\text{C}$ trong thang nhiệt độ Celsius thì trong thang nhiệt độ Kelvin, nhiệt độ của vật tăng thêm bao nhiêu?",
        "options": [
          "$15\\text{ K}$",
          "$288\\text{ K}$",
          "$258\\text{ K}$",
          "$1,5\\text{ K}$"
        ],
        "answer": "A",
        "explanation": "Độ biến thiên nhiệt độ trên thang Kelvin bằng độ biến thiên trên thang Celsius: $\\Delta T(\\text{K}) = \\Delta t(^\\circ\\text{C}) = 15\\text{ K}$."
      },
      {
        "id": "phy-2026-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "topic": "Vật lí nhiệt",
        "text": "Một khối khí nhận nhiệt lượng $Q = 150\\text{ J}$ và thực hiện một công $A' = 90\\text{ J}$ đẩy pít-tông dịch chuyển. Độ biến thiên nội năng $\\Delta U$ của khối khí là",
        "options": [
          "$60\\text{ J}$",
          "$240\\text{ J}$",
          "$-60\\text{ J}$",
          "$-240\\text{ J}$"
        ],
        "answer": "A",
        "explanation": "Theo Định luật I Nhiệt động lực học: $\\Delta U = Q + A = 150 + (-90) = 60\\text{ J}$ (khí thực hiện công nên $A = -90\\text{ J}$)."
      },
      {
        "id": "phy-2026-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "topic": "Khí lí tưởng",
        "text": "Trong quá trình đẳng nhiệt của một lượng khí lí tưởng xác định, khi áp suất của khí tăng lên $2,5$ lần thì thể tích của khí sẽ",
        "options": [
          "giảm đi $2,5$ lần",
          "tăng lên $2,5$ lần",
          "không thay đổi",
          "giảm đi $5$ lần"
        ],
        "answer": "A",
        "explanation": "Theo định luật Boyle ($pV = \\text{const}$), áp suất tỉ lệ nghịch với thể tích nên $p$ tăng 2,5 lần thì $V$ giảm 2,5 lần."
      },
      {
        "id": "phy-2026-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "topic": "Khí lí tưởng",
        "text": "Hệ thức nào sau đây biểu diễn đúng mối liên hệ giữa động năng tịnh tiến trung bình $\\overline{E_đ}$ của phân tử khí lí tưởng và nhiệt độ tuyệt đối $T$?",
        "options": [
          "$\\overline{E_đ} = \\frac{3}{2}kT$",
          "$\\overline{E_đ} = \\frac{2}{3}kT$",
          "$\\overline{E_đ} = kT$",
          "$\\overline{E_đ} = 3kT$"
        ],
        "answer": "A",
        "explanation": "Động năng tịnh tiến trung bình của phân tử khí lí tưởng tỉ lệ thuận với nhiệt độ tuyệt đối: $\\overline{E_đ} = \\frac{3}{2}kT$ với $k$ là hằng số Boltzmann."
      },
      {
        "id": "phy-2026-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "topic": "Từ trường",
        "text": "Một đoạn dây dẫn thẳng dài $l = 0,5\\text{ m}$ mang dòng điện $I = 4\\text{ A}$ đặt vuông góc với các đường sức từ của một từ trường đều có cảm ứng từ $B = 0,2\\text{ T}$. Độ lớn lực từ tác dụng lên đoạn dây là",
        "options": [
          "$0,4\\text{ N}$",
          "$4\\text{ N}$",
          "$0,2\\text{ N}$",
          "$2\\text{ N}$"
        ],
        "answer": "A",
        "explanation": "Công thức lực từ: $F = BIl\\sin 90^\\circ = 0,2 \\times 4 \\times 0,5 \\times 1 = 0,4\\text{ N}$."
      },
      {
        "id": "phy-2026-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "topic": "Cảm ứng điện từ",
        "text": "Định luật Lenz về chiều dòng điện cảm ứng là hệ quả của định luật bảo toàn nào sau đây?",
        "options": [
          "Định luật bảo toàn và chuyển hóa năng lượng",
          "Định luật bảo toàn điện tích",
          "Định luật bảo toàn khối lượng",
          "Định luật bảo toàn số nuclôn"
        ],
        "answer": "A",
        "explanation": "Định luật Lenz là hệ quả trực tiếp của định luật bảo toàn và chuyển hóa năng lượng (công cơ học chống lại lực từ chuyển hóa thành điện năng)."
      },
      {
        "id": "phy-2026-p1-q7",
        "section": "I",
        "type": "mcq",
        "number": 7,
        "topic": "Vật lí hạt nhân",
        "text": "Trong hạt nhân nguyên tử $^{235}_{92}\\text{U}$ có bao nhiêu hạt neutron?",
        "options": [
          "143",
          "92",
          "235",
          "327"
        ],
        "answer": "A",
        "explanation": "Số hạt neutron $N = A - Z = 235 - 92 = 143$."
      },
      {
        "id": "phy-2026-p1-q8",
        "section": "I",
        "type": "mcq",
        "number": 8,
        "topic": "Vật lí hạt nhân",
        "text": "Tia phóng xạ nào sau đây là dòng các hạt nhân nguyên tử $^{4}_{2}\\text{He}$?",
        "options": [
          "Tia $\\alpha$",
          "Tia $\\beta^-$",
          "Tia $\\beta^+$",
          "Tia $\\gamma$"
        ],
        "answer": "A",
        "explanation": "Tia $\\alpha$ là dòng các hạt nhân nguyên tử heli ($^4_2\\text{He}$)."
      },
      {
        "id": "phy-2026-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "topic": "Khí lí tưởng",
        "text": "Một bình kín có thể tích không đổi $V = 10\\text{ lít}$ chứa một lượng khí lí tưởng ở nhiệt độ $27^\\circ\\text{C}$ và áp suất $p_1 = 1,5\\text{ atm}$. Sau đó người ta đun nóng bình tới nhiệt độ $127^\\circ\\text{C}$.",
        "statements": [
          {
            "text": "Quá trình biến đổi trạng thái của khối khí là quá trình đẳng tích.",
            "answer": true
          },
          {
            "text": "Nhiệt độ tuyệt đối ban đầu của khối khí là $T_1 = 27\\text{ K}$.",
            "answer": false
          },
          {
            "text": "Áp suất của khí trong bình ở nhiệt độ $127^\\circ\\text{C}$ bằng $2,0\\text{ atm}$.",
            "answer": true
          },
          {
            "text": "Mật độ phân tử khí trong bình tăng lên gấp $\\frac{4}{3}$ lần sau khi đun nóng.",
            "answer": false
          }
        ],
        "explanation": "a) Đúng vì bình kín thể tích không đổi. b) Sai vì $T_1 = 27 + 273 = 300\\text{ K}$. c) Đúng vì $T_2 = 400\\text{ K} \\Rightarrow p_2 = p_1 \\frac{T_2}{T_1} = 1,5 \\times \\frac{400}{300} = 2,0\\text{ atm}$. d) Sai vì số phân tử $N$ và thể tích $V$ đều không đổi nên mật độ phân tử $n = N/V$ không đổi."
      },
      {
        "id": "phy-2026-p2-q2",
        "section": "II",
        "type": "truefalse",
        "number": 2,
        "topic": "Vật lí hạt nhân",
        "text": "Đồng vị phóng xạ Iodine $^{131}_{53}\\text{I}$ được dùng trong y học để điều trị bệnh tuyến giáp có chu kì bán rã $T = 8$ ngày. Ban đầu một bệnh nhân được nhận liều dược chất chứa $m_0 = 16\\text{ mg}$ $^{131}_{53}\\text{I}$.",
        "statements": [
          {
            "text": "Hạt nhân $^{131}_{53}\\text{I}$ có 53 proton và 78 neutron.",
            "answer": true
          },
          {
            "text": "Sau 8 ngày, khối lượng $^{131}_{53}\\text{I}$ còn lại trong cơ thể(chưa tính đào thải sinh học) là $8\\text{ mg}$.",
            "answer": true
          },
          {
            "text": "Sau 24 ngày, lượng chất phóng xạ $^{131}_{53}\\text{I}$ đã bị phân rã là $2\\text{ mg}$.",
            "answer": false
          },
          {
            "text": "Hằng số phóng xạ của $^{131}_{53}\\text{I}$ xấp xỉ bằng $1,00 \\times 10^{-6}\\text{ s}^{-1}$.",
            "answer": true
          }
        ],
        "explanation": "a) Đúng ($131-53=78$). b) Đúng (sau 1 chu kì còn $16/2 = 8\\text{ mg}$). c) Sai: sau 24 ngày ($3T$), lượng còn lại là $16/2^3 = 2\\text{ mg}$, còn lượng ĐÃ PHÂN RÃ là $16 - 2 = 14\\text{ mg}$. d) Đúng: $\\lambda = \\frac{\\ln 2}{8 \\times 86400} \\approx 1,00 \\times 10^{-6}\\text{ s}^{-1}$."
      },
      {
        "id": "phy-2026-p3-q1",
        "section": "III",
        "type": "short",
        "number": 1,
        "topic": "Vật lí nhiệt",
        "text": "Tính nhiệt lượng (theo đơn vị kJ) cần cung cấp để đun nóng $2\\text{ kg}$ nước từ $25^\\circ\\text{C}$ lên $100^\\circ\\text{C}$. Biết nhiệt dung riêng của nước là $c = 4200\\text{ J/(kg.K)}$.",
        "answer": "630",
        "acceptedAnswers": [
          "630"
        ],
        "explanation": "Nhiệt lượng cần cung cấp: $Q = mc\\Delta t = 2 \\times 4200 \\times (100 - 25) = 630\\,000\\text{ J} = 630\\text{ kJ}$."
      },
      {
        "id": "phy-2026-p3-q2",
        "section": "III",
        "type": "short",
        "number": 2,
        "topic": "Cảm ứng điện từ",
        "text": "Một khung dây phẳng gồm 100 vòng dây, diện tích mỗi vòng là $20\\text{ cm}^2$, đặt trong từ trường đều có vectơ cảm ứng từ vuông góc với mặt phẳng khung. Trong khoảng thời gian $0,05\\text{ s}$, cảm ứng từ giảm đều từ $0,5\\text{ T}$ về $0\\text{ T}$. Độ lớn suất điện động cảm ứng xuất hiện trong khung bằng bao nhiêu Vôn (V)?",
        "answer": "2",
        "acceptedAnswers": [
          "2",
          "2.0",
          "2,0"
        ],
        "explanation": "Độ lớn suất điện động cảm ứng: $e_c = N \\frac{|\\Delta B| \\cdot S}{\\Delta t} = 100 \\times \\frac{0,5 \\times 20 \\times 10^{-4}}{0,05} = 2\\text{ V}$."
      },
      {
        "id": "phy-2026-p3-q3",
        "section": "III",
        "type": "short",
        "number": 3,
        "topic": "Vật lí hạt nhân",
        "text": "Cho khối lượng của proton là $1,0073\\text{ amu}$, của neutron là $1,0087\\text{ amu}$ và của hạt nhân $^{4}_{2}\\text{He}$ là $4,0015\\text{ amu}$. Biết $1\\text{ amu}\\cdot c^2 = 931,5\\text{ MeV}$. Năng lượng liên kết của hạt nhân $^{4}_{2}\\text{He}$ bằng bao nhiêu MeV? (Làm tròn đến hàng phần mười).",
        "answer": "28.4",
        "acceptedAnswers": [
          "28.4",
          "28,4"
        ],
        "explanation": "Độ hụt khối $\\Delta m = 2(1,0073) + 2(1,0087) - 4,0015 = 0,0305\\text{ amu}$. Năng lượng liên kết $W_{lk} = 0,0305 \\times 931,5 \\approx 28,4\\text{ MeV}$."
      }
    ]
  },
  {
    "id": "exam-hoahoc-thithu-2026",
    "program": "2k9",
    "subject": "chemistry",
    "grade": "12",
    "year": "2026",
    "examType": "thi-thu",
    "examPeriod": "Chuẩn cấu trúc 2026",
    "examSession": "THPT số 1 Ngô Gia Tự & Bộ GD&ĐT",
    "periodLabel": "Đề luyện Tốt nghiệp THPT • Hóa học 12 • 2026",
    "title": "Hóa học 12 • Đề kiểm tra & Thi thử Tốt nghiệp THPT năm 2026 – Có lời giải chi tiết",
    "source": "Trường THPT số 1 Ngô Gia Tự – Đắk Lắk & Định dạng đề thi Tốt nghiệp THPT Bộ GD&ĐT 2026",
    "sourceFile": "https://drive.google.com/drive/folders/1-BvCsqfaRRqPlrGdAkfnO2bXkkBJuPzS?usp=sharing",
    "originUrl": "https://thpt-ngogiatu-daklak.edu.vn/khoi-12-de-va-dap-an-kiem-tra-cuoi-hoc-ky-ii-nam-hoc-2025-2026.htm",
    "duration": 50,
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.25
    },
    "questions": [
      {
        "id": "chem-2026-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "topic": "Ester - Lipid",
        "text": "Chất nào sau đây có tên gọi là ethyl acetate?",
        "options": [
          "$\\text{CH}_3\\text{COOC}_2\\text{H}_5$",
          "$\\text{C}_2\\text{H}_5\\text{COOCH}_3$",
          "$\\text{HCOOC}_2\\text{H}_5$",
          "$\\text{CH}_3\\text{COOCH}_3$"
        ],
        "answer": "A",
        "explanation": "Ethyl acetate là ester của acetic acid ($\\text{CH}_3\\text{COOH}$) và ethanol ($\\text{C}_2\\text{H}_5\\text{OH}$), công thức là $\\text{CH}_3\\text{COOC}_2\\text{H}_5$."
      },
      {
        "id": "chem-2026-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "topic": "Carbohydrate",
        "text": "Carbohydrate nào sau đây thuộc loại polysaccharide?",
        "options": [
          "Cellulose",
          "Glucose",
          "Saccharose",
          "Fructose"
        ],
        "answer": "A",
        "explanation": "Tinh bột và cellulose là polysaccharide; glucose và fructose là monosaccharide; saccharose là disaccharide."
      },
      {
        "id": "chem-2026-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "topic": "Amine - Amino acid - Protein",
        "text": "Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?",
        "options": [
          "Methylamine",
          "Aniline",
          "Glycine",
          "Glucose"
        ],
        "answer": "A",
        "explanation": "Methylamine ($\\text{CH}_3\\text{NH}_2$) có lực base mạnh hơn $\\text{NH}_3$ nên làm quỳ tím hóa xanh; aniline có tính base rất yếu không đổi màu quỳ tím."
      },
      {
        "id": "chem-2026-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "topic": "Amine - Amino acid - Protein",
        "text": "Số liên kết peptide trong một phân tử tripeptide mạch hở là",
        "options": [
          "2",
          "3",
          "1",
          "4"
        ],
        "answer": "A",
        "explanation": "Phân tử peptide mạch hở tạo bởi $n$ gốc $\\alpha$-amino acid có $n - 1$ liên kết peptide. Với tripeptide ($n=3$) có 2 liên kết peptide."
      },
      {
        "id": "chem-2026-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "topic": "Polymer",
        "text": "Polymer nào sau đây được điều chế bằng phản ứng trùng ngưng?",
        "options": [
          "Nylon-6,6",
          "Polyethylene (PE)",
          "Poly(vinyl chloride) (PVC)",
          "Polystyrene (PS)"
        ],
        "answer": "A",
        "explanation": "Nylon-6,6 được điều chế bằng phản ứng trùng ngưng giữa hexamethylenediamine và adipic acid."
      },
      {
        "id": "chem-2026-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "topic": "Pin điện & Điện phân",
        "text": "Trong pin điện hóa $\\text{Zn}-\\text{Cu}$, quá trình xảy ra ở cực âm (anode) là",
        "options": [
          "$\\text{Zn} \\to \\text{Zn}^{2+} + 2e$",
          "$\\text{Cu}^{2+} + 2e \\to \\text{Cu}$",
          "$\\text{Zn}^{2+} + 2e \\to \\text{Zn}$",
          "$\\text{Cu} \\to \\text{Cu}^{2+} + 2e$"
        ],
        "answer": "A",
        "explanation": "Ở anode (cực âm của pin Galvani) xảy ra sự oxi hóa kim loại có tính khử mạnh hơn: $\\text{Zn} \\to \\text{Zn}^{2+} + 2e$."
      },
      {
        "id": "chem-2026-p1-q7",
        "section": "I",
        "type": "mcq",
        "number": 7,
        "topic": "Kim loại IA - IIA",
        "text": "Nước cứng vĩnh cửu có thể được làm mềm bằng dung dịch chất nào sau đây?",
        "options": [
          "$\\text{Na}_2\\text{CO}_3$",
          "$\\text{NaCl}$",
          "$\\text{HCl}$",
          "$\\text{Ca(OH)}_2$ vừa đủ"
        ],
        "answer": "A",
        "explanation": "Ion $\\text{CO}_3^{2-}$ hoặc $\\text{PO}_4^{3-}$ kết tủa được cả ion $\\text{Ca}^{2+}$ và $\\text{Mg}^{2+}$ trong mọi loại nước cứng."
      },
      {
        "id": "chem-2026-p1-q8",
        "section": "I",
        "type": "mcq",
        "number": 8,
        "topic": "Kim loại chuyển tiếp & Phức chất",
        "text": "Trong phức chất $[\\text{Cu(NH}_3)_4]^{2+}$, số phối trí của nguyên tử trung tâm $\\text{Cu}^{2+}$ là",
        "options": [
          "4",
          "2",
          "6",
          "12"
        ],
        "answer": "A",
        "explanation": "Có 4 phối tử $\\text{NH}_3$ đơn càng liên kết trực tiếp với ion trung tâm $\\text{Cu}^{2+}$ nên số phối trí là 4."
      },
      {
        "id": "chem-2026-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "topic": "Ester - Lipid",
        "text": "Tiến hành thí nghiệm xà phòng hóa chất béo (dầu thực vật hoặc mỡ động vật) bằng dung dịch $\\text{NaOH}$ đặc đun nóng, sau đó thêm dung dịch $\\text{NaCl}$ bão hòa vào hỗn hợp sau phản ứng.",
        "statements": [
          {
            "text": "Phản ứng xà phòng hóa chất béo là phản ứng một chiều.",
            "answer": true
          },
          {
            "text": "Sản phẩm thu được gồm muối sodium của acid béo và glycerol.",
            "answer": true
          },
          {
            "text": "Việc thêm dung dịch $\\text{NaCl}$ bão hòa nhằm mục đích làm tăng tốc độ phản ứng thủy phân.",
            "answer": false
          },
          {
            "text": "Lớp chất rắn màu trắng nổi lên phía trên sau khi thêm $\\text{NaCl}$ bão hòa là muối của các acid béo (xà phòng).",
            "answer": true
          }
        ],
        "explanation": "a) Đúng. b) Đúng. c) Sai: thêm $\\text{NaCl}$ bão hòa để làm giảm độ tan của muối acid béo và tăng tỉ trọng dung dịch, giúp xà phòng tách lớp nổi lên. d) Đúng."
      },
      {
        "id": "chem-2026-p2-q2",
        "section": "II",
        "type": "truefalse",
        "number": 2,
        "topic": "Pin điện & Điện phân",
        "text": "Cho thế điện cực chuẩn của các cặp oxi hóa – khử: $E^\\circ_{\\text{Fe}^{2+}/\\text{Fe}} = -0,44\\text{ V}$ và $E^\\circ_{\\text{Ag}^+/\\text{Ag}} = +0,80\\text{ V}$. Thiết lập pin điện hóa $\\text{Fe}-\\text{Ag}$ ở điều kiện chuẩn.",
        "statements": [
          {
            "text": "Thanh sắt ($\\text{Fe}$) đóng vai trò là anode (cực âm), thanh bạc ($\\text{Ag}$) là cathode (cực dương).",
            "answer": true
          },
          {
            "text": "Sức điện động chuẩn của pin điện hóa $\\text{Fe}-\\text{Ag}$ bằng $1,24\\text{ V}$.",
            "answer": true
          },
          {
            "text": "Trong quá trình pin hoạt động, dòng electron ở mạch ngoài chuyển dịch từ cực $\\text{Ag}$ sang cực $\\text{Fe}$.",
            "answer": false
          },
          {
            "text": "Khi pin hoạt động, khối lượng thanh $\\text{Ag}$ tăng lên còn khối lượng thanh $\\text{Fe}$ giảm đi.",
            "answer": true
          }
        ],
        "explanation": "a) Đúng vì $E^\\circ_{\\text{Fe}^{2+}/\\text{Fe}} < E^\\circ_{\\text{Ag}^+/\\text{Ag}}$. b) Đúng: $E^\\circ_{\\text{pin}} = 0,80 - (-0,44) = 1,24\\text{ V}$. c) Sai: electron đi từ anode ($\\text{Fe}$) sang cathode ($\\text{Ag}$). d) Đúng."
      },
      {
        "id": "chem-2026-p3-q1",
        "section": "III",
        "type": "short",
        "number": 1,
        "topic": "Carbohydrate",
        "text": "Thủy phân hoàn toàn $34,2\\text{ gam}$ saccharose trong môi trường acid, sau đó trung hòa và đem toàn bộ dung dịch thu được thực hiện phản ứng tráng bạc (dư $\\text{AgNO}_3/\\text{NH}_3$). Tính khối lượng kết tủa bạc ($\\text{Ag}$) thu được theo đơn vị gam.",
        "answer": "43.2",
        "acceptedAnswers": [
          "43.2",
          "43,2"
        ],
        "explanation": "Số mol saccharose $= 34,2 / 342 = 0,1\\text{ mol}$. Thủy phân cho $0,1\\text{ mol}$ glucose và $0,1\\text{ mol}$ fructose; cả hai đều tráng bạc cho $2\\text{Ag}$ mỗi phân tử $\\Rightarrow n_{\\text{Ag}} = 4 \\times 0,1 = 0,4\\text{ mol} \\Rightarrow m_{\\text{Ag}} = 0,4 \\times 108 = 43,2\\text{ gam}$."
      },
      {
        "id": "chem-2026-p3-q2",
        "section": "III",
        "type": "short",
        "number": 2,
        "topic": "Ester - Lipid",
        "text": "Đun nóng $17,6\\text{ gam}$ ethyl acetate ($\\text{CH}_3\\text{COOC}_2\\text{H}_5$, $M = 88$) với $300\\text{ mL}$ dung dịch $\\text{NaOH } 1\\text{M}$. Cô cạn dung dịch sau phản ứng hoàn toàn thu được bao nhiêu gam chất rắn khan?",
        "answer": "20.4",
        "acceptedAnswers": [
          "20.4",
          "20,4"
        ],
        "explanation": "$n_{\\text{ester}} = 17,6 / 88 = 0,2\\text{ mol}$; $n_{\\text{NaOH}} = 0,3\\text{ mol}$. Chất rắn khan gồm $0,2\\text{ mol } \\text{CH}_3\\text{COONa}$ ($M=82$) và $0,1\\text{ mol } \\text{NaOH}$ dư ($M=40$). Khối lượng $= 0,2 \\times 82 + 0,1 \\times 40 = 16,4 + 4,0 = 20,4\\text{ gam}$."
      },
      {
        "id": "chem-2026-p3-q3",
        "section": "III",
        "type": "short",
        "number": 3,
        "topic": "Đại cương kim loại",
        "text": "Hòa tan hoàn toàn $5,6\\text{ gam}$ sắt ($\\text{Fe}$) vào dung dịch $\\text{HCl}$ dư, thu được $V$ lít khí $\\text{H}_2$ ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$, $1\\text{ mol khí} = 24,79\\text{ L}$). Giá trị của $V$ bằng bao nhiêu? (Làm tròn đến hai chữ số thập phân).",
        "answer": "2.48",
        "acceptedAnswers": [
          "2.48",
          "2,48",
          "2.479",
          "2,479"
        ],
        "explanation": "$n_{\\text{Fe}} = 5,6 / 56 = 0,1\\text{ mol} \\Rightarrow n_{\\text{H}_2} = 0,1\\text{ mol} \\Rightarrow V = 0,1 \\times 24,79 = 2,479\\text{ L} \\approx 2,48\\text{ L}$."
      }
    ]
  },
  {
    "id": "exam-tienganh-globalsuccess-2026",
    "program": "2k9",
    "subject": "english",
    "grade": "12",
    "year": "2026",
    "examType": "thi-thu",
    "examPeriod": "Global Success 12",
    "examSession": "THPT số 1 Ngô Gia Tự & Bộ GD&ĐT",
    "periodLabel": "Đề luyện Tốt nghiệp THPT • Tiếng Anh 12 • 2026",
    "title": "Tiếng Anh 12 • Đề thi thử Tốt nghiệp THPT 2026 (Global Success & Định dạng mới)",
    "source": "Trường THPT số 1 Ngô Gia Tự – Đắk Lắk & Định dạng đề thi Tốt nghiệp THPT môn Tiếng Anh 2026",
    "sourceFile": "https://drive.google.com/drive/folders/1huh2U_W-BdwHbp_Au9nlRPlEmlDmWA2z?usp=sharing",
    "originUrl": "https://thpt-ngogiatu-daklak.edu.vn/khoi-12-de-va-dap-an-kiem-tra-cuoi-hoc-ky-ii-nam-hoc-2025-2026.htm",
    "duration": 50,
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.25
    },
    "questions": [
      {
        "id": "eng-2026-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "topic": "Grammar & Tenses",
        "text": "While Steve Jobs ________ at Reed College, he attended a calligraphy class that later inspired the typography of the first Macintosh.",
        "options": [
          "was studying",
          "studied",
          "has studied",
          "is studying"
        ],
        "answer": "A",
        "explanation": "Diễn tả hành động đang diễn ra trong quá khứ (was studying) thì có hành động khác xen vào hoặc song hành trong bối cảnh quá khứ."
      },
      {
        "id": "eng-2026-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "topic": "Word Form",
        "text": "Cultural ________ helps young people appreciate different traditions and live harmoniously in a globalized world.",
        "options": [
          "diversity",
          "diversify",
          "diverse",
          "diversely"
        ],
        "answer": "A",
        "explanation": "Sau tính từ \"Cultural\" và làm chủ ngữ cho động từ \"helps\" cần một danh từ: \"Cultural diversity\" (sự đa dạng văn hóa)."
      },
      {
        "id": "eng-2026-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "topic": "Phrasal Verbs & Green Living",
        "text": "To reduce plastic waste, students are encouraged to ________ single-use plastic bottles and bring their own reusable flasks.",
        "options": [
          "cut down on",
          "look up to",
          "run out of",
          "put up with"
        ],
        "answer": "A",
        "explanation": "\"cut down on\" = cắt giảm (lượng tiêu thụ/sử dụng); thuộc chủ đề Green Living (Unit 3 Global Success 12)."
      },
      {
        "id": "eng-2026-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "topic": "Articles & Grammar",
        "text": "________ artificial intelligence (AI) is transforming the way students learn foreign languages and prepare for exams.",
        "options": [
          "Ø (no article)",
          "The",
          "An",
          "A"
        ],
        "answer": "A",
        "explanation": "Danh từ trừu tượng/không đếm được chỉ lĩnh vực chung \"artificial intelligence\" không dùng mạo từ khi nói khái quát."
      },
      {
        "id": "eng-2026-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "topic": "Relative Clauses",
        "text": " urbanization is a rapid process, ________ brings both economic opportunities and environmental challenges to big cities.",
        "options": [
          "which",
          "that",
          "who",
          "where"
        ],
        "answer": "A",
        "explanation": "Mệnh đề quan hệ không xác định (sau dấu phẩy) bổ nghĩa cho cả mệnh đề đứng trước dùng đại từ \"which\"."
      },
      {
        "id": "eng-2026-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "topic": "Sentence Arrangement",
        "text": "Choose the best arrangement of sentences to make a meaningful paragraph about lifelong learning:\na. First, it keeps our minds sharp and adaptable to technological changes.\nb. Lifelong learning is essential for personal and professional growth in the 21st century.\nc. Therefore, everyone should cultivate the habit of reading and acquiring new skills daily.\nd. Second, continuous learning opens doors to better career opportunities.",
        "options": [
          "b - a - d - c",
          "a - b - d - c",
          "b - d - a - c",
          "c - b - a - d"
        ],
        "answer": "A",
        "explanation": "Câu chủ đề (b) → Lý do thứ nhất (a: First) → Lý do thứ hai (d: Second) → Kết luận (c: Therefore)."
      },
      {
        "id": "eng-2026-p1-q7",
        "section": "I",
        "type": "mcq",
        "number": 7,
        "topic": "Comparisons",
        "text": "The more you practice solving real exam papers, ________ you become at managing your test time.",
        "options": [
          "the more confident",
          "more confident",
          "the most confident",
          "confident"
        ],
        "answer": "A",
        "explanation": "Cấu trúc so sánh kép (Double comparison): The + comparative + S + V, the + comparative + S + V."
      },
      {
        "id": "eng-2026-p1-q8",
        "section": "I",
        "type": "mcq",
        "number": 8,
        "topic": "Collocations & Career",
        "text": "Many high school graduates find it challenging to ________ a career path that matches both their passion and market demand.",
        "options": [
          "pursue",
          "do",
          "make",
          "take"
        ],
        "answer": "A",
        "explanation": "Collocation chuẩn trong Unit Career Paths: \"pursue a career path\" (theo đuổi con đường sự nghiệp)."
      },
      {
        "id": "eng-2026-p1-q9",
        "section": "I",
        "type": "mcq",
        "number": 9,
        "topic": "Subjunctive & Suggestions",
        "text": "The school counselor suggested that she ________ a detailed weekly study planner before the final exam.",
        "options": [
          "create",
          "creates",
          "created",
          "creating"
        ],
        "answer": "A",
        "explanation": "Cấu trúc giả định: suggest + that + S + (should) + V(nguyên thể không chia)."
      },
      {
        "id": "eng-2026-p1-q10",
        "section": "I",
        "type": "mcq",
        "number": 10,
        "topic": "Reading Comprehension",
        "text": "Read the passage snippet: \"Greenwashing occurs when a company spends more time and money claiming to be eco-friendly through advertising than actually minimizing its environmental impact.\" What does \"greenwashing\" mean according to the snippet?",
        "options": [
          "Misleading consumers into believing a company is more environmentally friendly than it really is.",
          "Cleaning industrial factories using green technology.",
          "Investing heavily in renewable energy and recycling programs.",
          "Teaching students how to protect the environment at school."
        ],
        "answer": "A",
        "explanation": "Đoạn văn nêu rõ greenwashing là khi công ty chi nhiều tiền quảng cáo \"thân thiện môi trường\" hơn là thực sự giảm tác động môi trường."
      },
      {
        "id": "eng-2026-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "topic": "Reading Comprehension",
        "text": "Read the passage: \"In recent years, digital learning platforms have revolutionized exam preparation for Vietnamese high school students. Instead of relying solely on printed handouts, students can now access interactive video lectures, practice real provincial mock exams with instant automated grading, and track their weekly progress. However, educators warn that digital tools are most effective only when combined with active recall, self-discipline, and regular note-taking.\" Decide whether the following statements are True or False:",
        "statements": [
          {
            "text": "Vietnamese high school students today only use printed handouts to prepare for exams.",
            "answer": false
          },
          {
            "text": "Digital platforms allow students to practice mock exams and receive instant grading.",
            "answer": true
          },
          {
            "text": "According to educators, digital tools alone guarantee high scores without self-discipline.",
            "answer": false
          },
          {
            "text": "Combining online learning with active recall and note-taking makes studying more effective.",
            "answer": true
          }
        ],
        "explanation": "a) Sai (\"Instead of relying solely on printed handouts\"). b) Đúng (\"instant automated grading\"). c) Sai (\"only when combined with active recall, self-discipline...\"). d) Đúng."
      }
    ]
  },
  {
    "id": "exam-lichsu-ktpl-hanoi-2026",
    "program": "2k9",
    "subject": "history",
    "grade": "12",
    "year": "2026",
    "examType": "thi-thu",
    "examPeriod": "Sở Hà Nội & Đà Nẵng 2026",
    "examSession": "Sở GD&ĐT Hà Nội / Đà Nẵng",
    "periodLabel": "Đề thi thử Tốt nghiệp THPT • Lịch sử & KTPL • 2026",
    "title": "Lịch sử & KTPL 12 • Đề thi thử Tốt nghiệp THPT Sở GD&ĐT Hà Nội & Đà Nẵng 2026",
    "source": "Tổng hợp từ nguồn Đề thi thử Lịch sử & KTPL Sở GD&ĐT Hà Nội, Đà Nẵng 2026 (DOL THPT & THPT Ngô Gia Tự)",
    "sourceFile": "https://dolthpt.vn/tot-nghiep-thpt/pdf-de-thi-thu-tot-nghiep-thpt-mon-lich-su-so-gd-dt-ha-noi-nam-2026-co-dap-an",
    "originUrl": "https://dolthpt.vn/tot-nghiep-thpt/pdf-de-thi-thu-tot-nghiep-thpt-mon-kt-pl-so-gd-dt-ha-noi-nam-2026-co-dap-an",
    "duration": 50,
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.25
    },
    "questions": [
      {
        "id": "his-2026-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "topic": "Thế giới trong và sau Chiến tranh lạnh",
        "text": "Sự kiện nào năm 1945 đánh dấu sự ra đời chính thức của tổ chức Liên hợp quốc (UN)?",
        "options": [
          "Bản Hiến chương Liên hợp quốc chính thức có hiệu lực ngày 24/10/1945.",
          "Hội nghị I-an-ta (2/1945) thông qua quyết định thành lập Liên hợp quốc.",
          "Chiến tranh thế giới thứ hai kết thúc thắng lợi ở châu Âu (5/1945).",
          "Tuyên ngôn Liên hợp quốc được 26 nước kí kết tại Oa-sinh-tơn (1942)."
        ],
        "answer": "A",
        "explanation": "Ngày 24/10/1945, sau khi Quốc hội các nước thành viên phê chuẩn, Hiến chương Liên hợp quốc chính thức có hiệu lực (Ngày Liên hợp quốc)."
      },
      {
        "id": "his-2026-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "topic": "ASEAN",
        "text": "Hiệp hội các quốc gia Đông Nam Á (ASEAN) được thành lập năm 1967 tại Băng Cốc (Thái Lan) với sự tham gia của 5 quốc gia sáng lập nào?",
        "options": [
          "In-đô-nê-xi-a, Ma-lai-xi-a, Phi-líp-pin, Xin-ga-po và Thái Lan.",
          "Việt Nam, Lào, Cam-pu-chia, Thái Lan và Xin-ga-po.",
          "Thái Lan, Mi-an-ma, Phi-líp-pin, Bru-nây và Ma-lai-xi-a.",
          "In-đô-nê-xi-a, Thái Lan, Việt Nam, Phi-líp-pin và Xin-ga-po."
        ],
        "answer": "A",
        "explanation": "Ngày 8/8/1967, 5 nước Indonesia, Malaysia, Philippines, Singapore và Thái Lan kí Tuyên bố Băng Cốc thành lập ASEAN."
      },
      {
        "id": "his-2026-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "topic": "Cách mạng tháng Tám & Kháng chiến",
        "text": "Thắng lợi quân sự nào của quân dân Việt Nam đã giáng đòn quyết định vào ý chí xâm lược của thực dân Pháp, trực tiếp đưa đến việc kí kết Hiệp định Giơ-ne-vơ năm 1954?",
        "options": [
          "Chiến dịch Điện Biên Phủ (1954)",
          "Chiến dịch Biên giới thu - đông (1950)",
          "Chiến dịch Việt Bắc thu - đông (1947)",
          "Chiến dịch Hồ Chí Minh (1975)"
        ],
        "answer": "A",
        "explanation": "Chiến thắng Điện Biên Phủ (7/5/1954) đập tan kế hoạch Nava và trực tiếp dẫn đến việc kí Hiệp định Giơ-ne-vơ."
      },
      {
        "id": "his-2026-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "topic": "Công cuộc Đổi mới",
        "text": "Đường lối Đổi mới toàn diện đất nước do Đại hội đại biểu toàn quốc lần thứ VI của Đảng Cộng sản Việt Nam (12/1986) đề ra lấy trọng tâm là đổi mới về",
        "options": [
          "kinh tế",
          "chính trị",
          "văn hóa - tư tưởng",
          "đối ngoại"
        ],
        "answer": "A",
        "explanation": "Đại hội VI (12/1986) xác định đổi mới phải toàn diện và đồng bộ, trong đó trọng tâm là đổi mới về kinh tế."
      },
      {
        "id": "his-2026-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "topic": "Kinh tế & Pháp luật 12",
        "text": "Chỉ tiêu nào sau đây phản ánh tổng giá trị thị trường của tất cả hàng hóa và dịch vụ cuối cùng được sản xuất ra trên lãnh thổ một quốc gia trong một thời kì nhất định?",
        "options": [
          "Tổng sản phẩm quốc nội (GDP)",
          "Tổng thu nhập quốc dân (GNI)",
          "Chỉ số giá tiêu dùng (CPI)",
          "Chỉ số phát triển con người (HDI)"
        ],
        "answer": "A",
        "explanation": "GDP (Gross Domestic Product) đo tổng giá trị hàng hóa và dịch vụ cuối cùng tạo ra trong phạm vi lãnh thổ quốc gia."
      },
      {
        "id": "his-2026-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "topic": "Kinh tế & Pháp luật 12",
        "text": "Loại hình bảo hiểm nào do Nhà nước tổ chức mà người sử dụng lao động và người lao động có giao kết hợp đồng lao động thuộc diện phải tham gia để bù đắp một phần thu nhập khi ốm đau, thai sản, hưu trí?",
        "options": [
          "Bảo hiểm xã hội bắt buộc",
          "Bảo hiểm thương mại",
          "Bảo hiểm trách nhiệm dân sự xe cơ giới",
          "Bảo hiểm tài sản tự nguyện"
        ],
        "answer": "A",
        "explanation": "Theo Luật Bảo hiểm xã hội, người lao động làm việc theo hợp đồng lao động thuộc đối tượng tham gia bảo hiểm xã hội bắt buộc."
      },
      {
        "id": "his-2026-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "topic": "Lịch sử đối ngoại Việt Nam",
        "text": "Đọc đoạn tư liệu sau: \"Ngày 28/7/1995, tại Hội nghị Bộ trưởng Ngoại giao ASEAN lần thứ 28 ở Bru-nây, Việt Nam chính thức trở thành thành viên thứ 7 của ASEAN. Sự kiện này không chỉ mở ra một chương mới trong lịch sử hội nhập khu vực của Việt Nam mà còn thúc đẩy quá trình xây dựng một Đông Nam Á hòa bình, hợp tác, tiến tới ASEAN-10.\"",
        "statements": [
          {
            "text": "Việt Nam là một trong 5 quốc gia sáng lập tổ chức ASEAN từ năm 1967.",
            "answer": false
          },
          {
            "text": "Việt Nam chính thức gia nhập ASEAN vào ngày 28/7/1995 và là thành viên thứ 7 của tổ chức này.",
            "answer": true
          },
          {
            "text": "Việc Việt Nam gia nhập ASEAN đã góp phần thúc đẩy quá trình mở rộng ASEAN từ 6 nước lên 10 nước Đông Nam Á.",
            "answer": true
          },
          {
            "text": "Gia nhập ASEAN là bước đột phá quan trọng trong việc thực hiện đường lối đối ngoại độc lập, tự chủ, đa phương hóa, đa dạng hóa của Việt Nam thời kì Đổi mới.",
            "answer": true
          }
        ],
        "explanation": "a) Sai (Việt Nam gia nhập năm 1995, thành viên thứ 7). b, c, d) Đúng theo tư liệu và lịch sử ngoại giao Việt Nam."
      }
    ]
  },
  {
    "id": "exam-dgnl-hsa-vact-2026",
    "program": "2k9",
    "subject": "math",
    "grade": "12",
    "year": "2026",
    "examType": "dgnl",
    "examPeriod": "Đợt 1 • 2026",
    "examSession": "ĐGNL HSA & V-ACT • Phúc K9",
    "periodLabel": "Đánh Giá Năng Lực • HSA / V-ACT • 2026",
    "title": "ĐGNL 2026 • Đề thực chiến Tư duy Định lượng & Khoa học Tự nhiên (HSA / V-ACT)",
    "source": "HỌC CÙNG PHÚC K9 • Biên soạn theo cấu trúc ĐGNL ĐHQG Hà Nội (HSA) & ĐHQG TP.HCM (V-ACT) 2026",
    "sourceFile": "/exam-sources/lam-dong-toan-2026-lan-1.pdf",
    "originUrl": "https://vqa.moet.gov.vn/vi/news/thong-bao/cau-truc-dinh-dang-de-thi-tot-nghiep-thpt-tu-nam-2025-74.html",
    "duration": 60,
    "published": true,
    "scoring": {
      "mcq": 0.25,
      "tf": [
        0,
        0.1,
        0.25,
        0.5,
        1
      ],
      "short": 0.5
    },
    "questions": [
      {
        "id": "dgnl-2026-p1-q1",
        "section": "I",
        "type": "mcq",
        "number": 1,
        "topic": "Tư duy Định lượng",
        "text": "Sự tăng trưởng của một quần thể vi khuẩn tuân theo công thức $N(t) = N_0 \\cdot e^{rt}$, trong đó $N_0$ là số lượng vi khuẩn ban đầu, $r$ là tỉ lệ tăng trưởng. Biết sau 3 giờ số vi khuẩn tăng gấp đôi. Hỏi sau bao nhiêu giờ kể từ ban đầu thì số lượng vi khuẩn tăng gấp 8 lần?",
        "options": [
          "9 giờ",
          "6 giờ",
          "12 giờ",
          "24 giờ"
        ],
        "answer": "A",
        "explanation": "Sau 3 giờ tăng gấp đôi: $e^{3r} = 2$. Để tăng gấp 8 lần ($2^3$): $e^{rt} = 8 = (e^{3r})^3 = e^{9r} \\Rightarrow t = 9$ giờ."
      },
      {
        "id": "dgnl-2026-p1-q2",
        "section": "I",
        "type": "mcq",
        "number": 2,
        "topic": "Phân tích Số liệu",
        "text": "Doanh thu quý I, II, III, IV của một công ty công nghệ năm 2025 lần lượt là 120; 150; 180; 230 (tỷ đồng). Tốc độ tăng trưởng doanh thu của Quý IV so với Quý I là bao nhiêu phần trăm?",
        "options": [
          "$91,67\\%$",
          "$52,17\\%$",
          "$191,67\\%$",
          "$110\\%$"
        ],
        "answer": "A",
        "explanation": "Tốc độ tăng trưởng $= \\frac{230 - 120}{120} \\times 100\\% = \\frac{110}{120} \\times 100\\% \\approx 91,67\\%$.",
        "table": [
          [
            "Quý",
            "Quý I",
            "Quý II",
            "Quý III",
            "Quý IV"
          ],
          [
            "Doanh thu (tỷ đồng)",
            "120",
            "150",
            "180",
            "230"
          ]
        ]
      },
      {
        "id": "dgnl-2026-p1-q3",
        "section": "I",
        "type": "mcq",
        "number": 3,
        "topic": "Tư duy Định lượng",
        "text": "Cho hàm số $y = f(x)$ có đạo hàm $f'(x) = x^2(x-1)(x+2)^3$. Số điểm cực trị của hàm số $y = f(x)$ là",
        "options": [
          "2",
          "3",
          "1",
          "4"
        ],
        "answer": "A",
        "explanation": "$f'(x)$ đổi dấu khi đi qua các nghiệm bội lẻ là $x = 1$ và $x = -2$ (nghiệm $x = 0$ là nghiệm bội chẵn không đổi dấu). Vậy hàm số có 2 điểm cực trị."
      },
      {
        "id": "dgnl-2026-p1-q4",
        "section": "I",
        "type": "mcq",
        "number": 4,
        "topic": "Khoa học Tự nhiên - Vật lí",
        "text": "Một sóng điện từ lan truyền trong chân không với bước sóng $\\lambda = 60\\text{ m}$. Biết tốc độ ánh sáng trong chân không $c = 3 \\times 10^8\\text{ m/s}$. Tần số $f$ của sóng điện từ này là",
        "options": [
          "$5\\text{ MHz}$",
          "$50\\text{ MHz}$",
          "$0,5\\text{ MHz}$",
          "$18\\text{ MHz}$"
        ],
        "answer": "A",
        "explanation": "$f = \\frac{c}{\\lambda} = \\frac{3 \\times 10^8}{60} = 5 \\times 10^6\\text{ Hz} = 5\\text{ MHz}$."
      },
      {
        "id": "dgnl-2026-p1-q5",
        "section": "I",
        "type": "mcq",
        "number": 5,
        "topic": "Khoa học Tự nhiên - Hóa học",
        "text": "Khi lên men $180\\text{ gam}$ glucose với hiệu suất $80\\%$, khối lượng ethanol ($\\text{C}_2\\text{H}_5\\text{OH}$, $M = 46$) thu được là",
        "options": [
          "$73,6\\text{ gam}$",
          "$92,0\\text{ gam}$",
          "$46,0\\text{ gam}$",
          "$36,8\\text{ gam}$"
        ],
        "answer": "A",
        "explanation": "$\\text{C}_6\\text{H}_{12}\\text{O}_6 \\to 2\\text{C}_2\\text{H}_5\\text{OH} + 2\\text{CO}_2$. $n_{\\text{glucose}} = 1\\text{ mol} \\Rightarrow n_{\\text{ethanol}} = 2 \\times 0,8 = 1,6\\text{ mol} \\Rightarrow m = 1,6 \\times 46 = 73,6\\text{ gam}$."
      },
      {
        "id": "dgnl-2026-p1-q6",
        "section": "I",
        "type": "mcq",
        "number": 6,
        "topic": "Khoa học Tự nhiên - Sinh học",
        "text": "Một phân tử DNA mạch kép có tổng số $3000$ nucleotide và có số nucleotide loại Adenine ($A$) chiếm $20\\%$ tổng số nucleotide. Số liên kết hydrogen của phân tử DNA này là",
        "options": [
          "3900",
          "3600",
          "3000",
          "4200"
        ],
        "answer": "A",
        "explanation": "$A = T = 20\\% \\times 3000 = 600$; $G = C = 30\\% \\times 3000 = 900$. Số liên kết hydrogen $H = 2A + 3G = 2(600) + 3(900) = 3900$."
      },
      {
        "id": "dgnl-2026-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "topic": "Xác suất & Thống kê ứng dụng",
        "text": "Một xét nghiệm y tế chẩn đoán một loại virus có độ nhạy $95\\%$ (nếu người nhiễm virus thì xác suất xét nghiệm dương tính là $0,95$) và độ đặc hiệu $98\\%$ (nếu người không nhiễm virus thì xác suất xét nghiệm âm tính là $0,98$). Giả sử tỉ lệ người nhiễm virus trong cộng đồng là $1\\%$.",
        "statements": [
          {
            "text": "Xác suất chọn ngẫu nhiên một người trong cộng đồng không nhiễm virus là $0,99$.",
            "answer": true
          },
          {
            "text": "Xác suất một người không nhiễm virus nhưng có kết quả xét nghiệm dương tính giả là $0,02$.",
            "answer": true
          },
          {
            "text": "Xác suất một người bất kỳ có kết quả xét nghiệm dương tính là $0,0293$.",
            "answer": true
          },
          {
            "text": "Nếu một người có kết quả xét nghiệm dương tính, xác suất người đó thực sự nhiễm virus lớn hơn $80\\%$.",
            "answer": false
          }
        ],
        "explanation": "Theo công thức Bayes: $P(+) = 0,01 \\times 0,95 + 0,99 \\times 0,02 = 0,0095 + 0,0198 = 0,0293$. Xác suất thực sự nhiễm khi dương tính là $0,0095 / 0,0293 \\approx 32,4\\% < 80\\%$, nên ý d sai."
      },
      {
        "id": "dgnl-2026-p3-q1",
        "section": "III",
        "type": "short",
        "number": 1,
        "topic": "Tối ưu hóa - Đạo hàm",
        "text": "Một người nông dân có $120\\text{ m}$ hàng rào muốn rào một khu đất hình chữ nhật tiếp giáp với một bờ tường thẳng có sẵn (không cần rào phía bờ tường). Diện tích lớn nhất của khu đất có thể rào được là bao nhiêu mét vuông ($\text{m}^2$)?",
        "answer": "1800",
        "acceptedAnswers": [
          "1800"
        ],
        "explanation": "Gọi hai cạnh vuông góc bờ tường là $x$, cạnh song song bờ tường là $120 - 2x$. Diện tích $S(x) = x(120 - 2x) = -2x^2 + 120x$ đạt GTLN tại $x = 30\\text{ m}$, khi đó $S_{\\max} = 30 \\times 60 = 1800\\text{ m}^2$."
      },
      {
        "id": "dgnl-2026-p3-q2",
        "section": "III",
        "type": "short",
        "number": 2,
        "topic": "Hình học Oxyz",
        "text": "Trong không gian $Oxyz$, tìm giá trị nhỏ nhất của biểu thức $P = MA + MB$ biết $A(1; 1; 2)$, $B(3; 5; -2)$ và điểm $M$ di động trên mặt phẳng $(Oxy)$.",
        "answer": "6",
        "acceptedAnswers": [
          "6"
        ],
        "explanation": "Do $z_A = 2 > 0$ và $z_B = -2 < 0$, hai điểm $A, B$ nằm khác phía so với mặt phẳng $(Oxy)$. Khi đó $MA + MB \\ge AB = \\sqrt{(3-1)^2 + (5-1)^2 + (-2-2)^2} = \\sqrt{4 + 16 + 16} = 6$. Dấu bằng xảy ra khi $M$ là giao điểm của đoạn $AB$ với $(Oxy)$."
      }
    ]
  }
];
