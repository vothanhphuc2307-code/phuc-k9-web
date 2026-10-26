'use strict';

// Seed exam data kept separate from API logic so both API endpoints can audit it.
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
        "sourcePage": 3
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
        "sourcePage": 4
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
        "sourcePage": 4
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
        "sourcePage": 4
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
        "sourcePage": 5
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
        "sourcePage": 5
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
        "sourcePage": 6
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
        "sourcePage": 6
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
        ]
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
        "sourcePage": 7
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
        "sourcePage": 7
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
        "sourcePage": 7
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
        "sourcePage": 9
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
        "sourcePage": 10
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
        "sourcePage": 11
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
        "sourcePage": 11
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
        "sourcePage": 12
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
        "sourcePage": 12
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
        "sourcePage": 12
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
        "sourcePage": 12
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
        "sourcePage": 12
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
        "sourcePage": 13
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
        1.0
      ],
      "short": 0.5
    }
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
        "sourcePage": 2
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
        "sourcePage": 3
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
        "sourcePage": 3
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
        "sourcePage": 4
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
        "sourcePage": 4
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
        "sourcePage": 4
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q7",
        "section": "I",
        "type": "mcq",
        "number": 7,
        "text": "Hình dưới đây mô tả sơ đồ kiểu nhân về số lượng NST ở các tế bào soma của các cơ thể thuộc cùng một loài thực vật. Tế bào nào sau đây thuộc đột biến lệch bội dạng thể ba?",
        "options": [
          "Tế bào 2",
          "Tế bào 3",
          "Tế bào 1",
          "Tế bào 4"
        ],
        "answer": "A",
        "explanation": "Tạm xác định theo đối chiếu cấu trúc câu hỏi; hình karyotype không được trích rõ trong bản PDF nguồn nên đánh dấu cần rà soát.",
        "sourcePage": 5,
        "reviewRequired": true
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
        "sourcePage": 5
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
        "sourcePage": 5
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
        "sourcePage": 6
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
        "sourcePage": 6
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
        "sourcePage": 6
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
        "sourcePage": 7
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
        "sourcePage": 7
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
        "sourcePage": 7
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
        "sourcePage": 7
      },
      {
        "id": "bio-2026-dienbien-0401-p1-q17",
        "section": "I",
        "type": "mcq",
        "number": 17,
        "text": "Hình bên mô tả giai đoạn nào của quy trình công nghệ gene để tạo sinh vật biến đổi gene?",
        "options": [
          "Tạo ra sinh vật mang gene biến đổi",
          "Tạo plasmid",
          "Tạo thể truyền",
          "Tạo DNA tái tổ hợp"
        ],
        "answer": "D",
        "explanation": "Hình được dùng trong nguồn là dạng ghép gene vào vector bằng enzyme cắt/nối, tương ứng tạo DNA tái tổ hợp; cần đối chiếu hình gốc khi publish.",
        "sourcePage": 8,
        "reviewRequired": true
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
        "sourcePage": 8
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q1",
        "section": "II",
        "type": "truefalse",
        "number": 1,
        "text": "PHẦN II – câu hỏi Đúng/Sai của đề Sinh Điện Biên 2026.",
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
        ]
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q2",
        "section": "II",
        "type": "truefalse",
        "number": 2,
        "text": "PHẦN II – câu hỏi Đúng/Sai của đề Sinh Điện Biên 2026.",
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
        "sourcePage": 9
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q3",
        "section": "II",
        "type": "truefalse",
        "number": 3,
        "text": "PHẦN II – câu hỏi Đúng/Sai của đề Sinh Điện Biên 2026.",
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
        "sourcePage": 10
      },
      {
        "id": "bio-2026-dienbien-0401-p2-q4",
        "section": "II",
        "type": "truefalse",
        "number": 4,
        "text": "PHẦN II – câu hỏi Đúng/Sai của đề Sinh Điện Biên 2026.",
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
        "sourcePage": 10
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
        "sourcePage": 12
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
        "sourcePage": 12
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q3",
        "section": "III",
        "type": "short",
        "number": 3,
        "text": "Hình dưới đây mô tả các cấu trúc tham gia cơ chế điều hòa biểu hiện gene của Operon Lac ở E.coli. Gene điều hòa nằm ở vị trí tương ứng với số mấy trên hình?",
        "answer": "1",
        "acceptedAnswers": [
          "1"
        ],
        "explanation": "Trong sơ đồ lac operon điển hình, gene điều hòa lacI nằm ở vị trí đầu vùng điều hòa; bản PDF không trích hình rõ nên đánh dấu cần rà soát.",
        "sourcePage": 12,
        "reviewRequired": true
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
        "sourcePage": 12
      },
      {
        "id": "bio-2026-dienbien-0401-p3-q5",
        "section": "III",
        "type": "short",
        "number": 5,
        "text": "Hình cây phát sinh chủng loại của 5 nhóm sinh vật; chọn các phát biểu đúng theo thứ tự từ nhỏ đến lớn.",
        "answer": "135",
        "acceptedAnswers": [
          "135"
        ],
        "explanation": "Theo mô tả cây nguồn: nhóm có chung nguồn gốc; thực vật gần nấm; và phát sinh các nhóm là kết quả của tiến hóa. Hai phát biểu về thời điểm xuất hiện tuyệt đối không được suy ra như đã nêu.",
        "sourcePage": 12,
        "reviewRequired": true
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
        "sourcePage": 12
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
        1.0
      ],
      "short": 0.25
    }
  }
];
