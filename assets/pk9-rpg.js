/* ============================================================================
 * HỌC CÙNG PHÚC K9 — RPG STUDY ENGINE, 118 IUPAC PERIODIC TABLE, SHOP,
 * SPACED REPETITION (SRS), JOURNEY ISLANDS & DIGITAL STUDENT QR CARD
 * ============================================================================ */
(function (window, document) {
  'use strict';

  // Compact verified IUPAC 118-element table: [z, sym, name, mass, row, col, cat, config, val, tip]
  // Cats: nonmetal, noble, alkali, alkaline, metalloid, halogen, transition, post, lanthanide, actinide
  const RAW_118 = [
    [1,'H','Hiđro (Hydrogen)',1.008,1,1,'nonmetal','1s¹','+1, -1','Phi kim nhẹ nhất, cấu tạo H2O và axit'],
    [2,'He','Heli (Helium)',4.0026,1,18,'noble','1s²','0','Khí hiếm bền vững (2e lớp ngoài cùng)'],
    [3,'Li','Liti (Lithium)',6.94,2,1,'alkali','[He] 2s¹','+1','Kim loại kiềm nhẹ nhất, nổi trên dầu hỏa'],
    [4,'Be','Beri (Beryllium)',9.0122,2,2,'alkaline','[He] 2s²','+2','Kim loại kiềm thổ, Be(OH)2 lưỡng tính'],
    [5,'B','Bo (Boron)',10.81,2,13,'metalloid','[He] 2s² 2p¹','+3','Á kim nhóm IIIA'],
    [6,'C','Cacbon (Carbon)',12.011,2,14,'nonmetal','[He] 2s² 2p²','-4, +2, +4','Nền tảng mọi hợp chất hữu cơ'],
    [7,'N','Nitơ (Nitrogen)',14.007,2,15,'nonmetal','[He] 2s² 2p³','-3..+5','Chiếm 78% không khí, tạo NH3 & HNO3'],
    [8,'O','Oxi (Oxygen)',15.999,2,16,'nonmetal','[He] 2s² 2p⁴','-2, (-1)','Chất oxi hóa mạnh, duy trì sự sống'],
    [9,'F','Flo (Fluorine)',18.998,2,17,'halogen','[He] 2s² 2p⁵','-1','Phi kim mạnh nhất, độ âm điện cao nhất (3.98)'],
    [10,'Ne','Neon',20.180,2,18,'noble','[He] 2s² 2p⁶','0','Khí hiếm phát sáng đỏ cam trong đèn'],
    [11,'Na','Natri (Sodium)',22.990,3,1,'alkali','[Ne] 3s¹','+1','Kim loại kiềm phổ biến, đốt cho ngọn lửa vàng'],
    [12,'Mg','Magie (Magnesium)',24.305,3,2,'alkaline','[Ne] 3s²','+2','Tạo chất diệp lục, cháy sáng rực trong O2/CO2'],
    [13,'Al','Nhôm (Aluminum)',26.982,3,13,'post','[Ne] 3s² 3p¹','+3','Nhiệt nhôm, Al2O3 & Al(OH)3 lưỡng tính'],
    [14,'Si','Silic (Silicon)',28.085,3,14,'metalloid','[Ne] 3s² 3p²','+4, -4','Chất bán dẫn chính trong vi mạch'],
    [15,'P','Photpho (Phosphorus)',30.974,3,15,'nonmetal','[Ne] 3s² 3p³','-3, +3, +5','P trắng độc tự bốc cháy; P đỏ làm que diêm'],
    [16,'S','Lưu huỳnh (Sulfur)',32.06,3,16,'nonmetal','[Ne] 3s² 3p⁴','-2, +4, +6','Sản xuất H2SO4 và lưu hóa cao su'],
    [17,'Cl','Clo (Chlorine)',35.45,3,17,'halogen','[Ne] 3s² 3p⁵','-1..+7','Khí vàng lục, khử trùng nước & làm PVC'],
    [18,'Ar','Argon',39.948,3,18,'noble','[Ne] 3s² 3p⁶','0','Khí hiếm chiếm ~0.93% không khí'],
    [19,'K','Kali (Potassium)',39.098,4,1,'alkali','[Ar] 4s¹','+1','Phân bón NPK, ngọn lửa màu tím hoa cà'],
    [20,'Ca','Canxi (Calcium)',40.078,4,2,'alkaline','[Ar] 4s²','+2','Cấu tạo xương, CaCO3 đá vôi gây nước cứng'],
    [21,'Sc','Scandi (Scandium)',44.956,4,3,'transition','[Ar] 3d¹ 4s²','+3','Kim loại chuyển tiếp dãy 3d đầu tiên'],
    [22,'Ti','Titan (Titanium)',47.867,4,4,'transition','[Ar] 3d² 4s²','+2, +3, +4','Nhẹ, siêu bền, chế tạo vỏ máy bay & y tế'],
    [23,'V','Vanadi (Vanadium)',50.942,4,5,'transition','[Ar] 3d³ 4s²','+2..+5','V2O5 làm xúc tác oxi hóa SO2 → SO3'],
    [24,'Cr','Crom (Chromium)',51.996,4,6,'transition','[Ar] 3d⁵ 4s¹','+2, +3, +6','Cứng nhất kim loại; K2Cr2O7 da cam'],
    [25,'Mn','Mangan (Manganese)',54.938,4,7,'transition','[Ar] 3d⁵ 4s²','+2, +4, +7','KMnO4 tím & MnO2 điều chế Cl2 trong PTN'],
    [26,'Fe','Sắt (Iron)',55.845,4,8,'transition','[Ar] 3d⁶ 4s²','+2, +3','Kim loại trọng điểm đề thi: Fe2+ / Fe3+ / oxit từ'],
    [27,'Co','Coban (Cobalt)',58.933,4,9,'transition','[Ar] 3d⁷ 4s²','+2, +3','Tạo hợp kim chịu nhiệt, vitamin B12'],
    [28,'Ni','Niken (Nickel)',58.693,4,10,'transition','[Ar] 3d⁸ 4s²','+2','Xúc tác phản ứng cộng H2 anken/chất béo lỏng'],
    [29,'Cu','Đồng (Copper)',63.546,4,11,'transition','[Ar] 3d¹⁰ 4s¹','+1, +2','Đỏ, dẫn điện tốt; Cu(OH)2 tạo phức xanh biure'],
    [30,'Zn','Kẽm (Zinc)',65.38,4,12,'transition','[Ar] 3d¹⁰ 4s²','+2','Mạ bảo vệ thép (ăn mòn điện hóa), ZnO lưỡng tính'],
    [31,'Ga','Gali (Gallium)',69.723,4,13,'post','[Ar] 3d¹⁰ 4s² 4p¹','+3','Nhiệt độ nóng chảy 29.8°C, tan trong lòng bàn tay'],
    [32,'Ge','Gemani (Germanium)',72.630,4,14,'metalloid','[Ar] 3d¹⁰ 4s² 4p²','+2, +4','Á kim dùng trong bán dẫn quang học'],
    [33,'As','Asen (Arsenic)',74.922,4,15,'metalloid','[Ar] 3d¹⁰ 4s² 4p³','-3, +3, +5','Thạch tín (As2O3) cực độc'],
    [34,'Se','Selen (Selenium)',78.971,4,16,'nonmetal','[Ar] 3d¹⁰ 4s² 4p⁴','-2, +4, +6','Vi chất chống oxi hóa & tế bào quang điện'],
    [35,'Br','Brom (Bromine)',79.904,4,17,'halogen','[Ar] 3d¹⁰ 4s² 4p⁵','-1..+5','Phi kim duy nhất ở trạng thái lỏng màu nâu đỏ'],
    [36,'Kr','Kripton (Krypton)',83.798,4,18,'noble','[Ar] 3d¹⁰ 4s² 4p⁶','0, (+2)','Khí hiếm dùng trong đèn flash nhiếp ảnh'],
    [37,'Rb','Rubiđi (Rubidium)',85.468,5,1,'alkali','[Kr] 5s¹','+1','Kim loại kiềm phản ứng mãnh liệt với H2O'],
    [38,'Sr','Stronti (Strontium)',87.62,5,2,'alkaline','[Kr] 5s²','+2','Tạo màu đỏ thắm trong pháo hoa'],
    [39,'Y','Ytri (Yttrium)',88.906,5,3,'transition','[Kr] 4d¹ 5s²','+3','Vật liệu siêu dẫn YBa2Cu3O7'],
    [40,'Zr','Ziriconi (Zirconium)',91.224,5,4,'transition','[Kr] 4d² 5s²','+4','Chịu ăn mòn, làm vỏ thanh nhiên liệu hạt nhân'],
    [41,'Nb','Niobi (Niobium)',92.906,5,5,'transition','[Kr] 4d⁴ 5s¹','+5','Thép siêu bền & nam châm siêu dẫn'],
    [42,'Mo','Molipđen (Molybdenum)',95.95,5,6,'transition','[Kr] 4d⁵ 5s¹','+4, +6','Hợp kim chịu nhiệt độ cao'],
    [43,'Tc','Tecneti (Technetium)',98,5,7,'transition','[Kr] 4d⁵ 5s²','+7','Nguyên tố phóng xạ nhân tạo đầu tiên'],
    [44,'Ru','Ruteni (Ruthenium)',101.07,5,8,'transition','[Kr] 4d⁷ 5s¹','+3, +4, +8','Xúc tác tổng hợp hữu cơ thế hệ mới'],
    [45,'Rh','Rođi (Rhodium)',102.91,5,9,'transition','[Kr] 4d⁸ 5s¹','+3','Kim loại quý dùng trong bộ lọc khí thải ô tô'],
    [46,'Pd','Palađi (Palladium)',106.42,5,10,'transition','[Kr] 4d¹⁰','+2, +4','Xúc tác Lindlar ankin → anken, hấp phụ H2'],
    [47,'Ag','Bạc (Silver)',107.87,5,11,'transition','[Kr] 4d¹⁰ 5s¹','+1','Dẫn điện & dẫn nhiệt tốt nhất; AgNO3/NH3 tráng bạc'],
    [48,'Cd','Cađimi (Cadmium)',112.41,5,12,'transition','[Kr] 4d¹⁰ 5s²','+2','Pin Ni-Cd & thanh điều khiển lò phản ứng'],
    [49,'In','Inđi (Indium)',114.82,5,13,'post','[Kr] 4d¹⁰ 5s² 5p¹','+3','Màng dẫn điện trong suốt ITO màn hình cảm ứng'],
    [50,'Sn','Thiếc (Tin)',118.71,5,14,'post','[Kr] 4d¹⁰ 5s² 5p²','+2, +4','Thiếc hàn & tráng hộp sắt tây chống gỉ'],
    [51,'Sb','Antimon (Antimony)',121.76,5,15,'metalloid','[Kr] 4d¹⁰ 5s² 5p³','+3, +5','Hợp kim làm bản cực ắc quy chì'],
    [52,'Te','Telu (Tellurium)',127.60,5,16,'metalloid','[Kr] 4d¹⁰ 5s² 5p⁴','-2, +4, +6','Pin mặt trời CdTe & hợp kim nhiệt điện'],
    [53,'I','Iot (Iodine)',126.90,5,17,'halogen','[Kr] 4d¹⁰ 5s² 5p⁵','-1..+7','Thăng hoa tím; làm xanh hồ tinh bột'],
    [54,'Xe','Xenon',131.29,5,18,'noble','[Kr] 4d¹⁰ 5s² 5p⁶','0, +2, +4, +6','Khí hiếm đầu tiên tổng hợp được hợp chất XePtF6'],
    [55,'Cs','Xesi (Cesium)',132.91,6,1,'alkali','[Xe] 6s¹','+1','Kim loại hoạt động mạnh nhất, đồng hồ nguyên tử'],
    [56,'Ba','Bari (Barium)',137.33,6,2,'alkaline','[Xe] 6s²','+2','BaSO4 kết tủa trắng không tan trong axit & chụp X-quang'],
    [57,'La','Lantan (Lanthanum)',138.91,9,4,'lanthanide','[Xe] 5d¹ 6s²','+3','Nguyên tố đầu họ Lantan đất hiếm'],
    [58,'Ce','Xeri (Cerium)',140.12,9,5,'lanthanide','[Xe] 4f¹ 5d¹ 6s²','+3, +4','Đá lửa bật lửa & chất đánh bóng thủy tinh'],
    [59,'Pr','Prazeođim',140.91,9,6,'lanthanide','[Xe] 4f³ 6s²','+3','Kính bảo hộ thợ hàn màu vàng xanh'],
    [60,'Nd','Neođim (Neodymium)',144.24,9,7,'lanthanide','[Xe] 4f⁴ 6s²','+3','Nam châm vĩnh cửu mạnh nhất NdFeB'],
    [61,'Pm','Prometi',145,9,8,'lanthanide','[Xe] 4f⁵ 6s²','+3','Đất hiếm phóng xạ dùng trong pin hạt nhân'],
    [62,'Sm','Samari',150.36,9,9,'lanthanide','[Xe] 4f⁶ 6s²','+2, +3','Nam châm SmCo chịu nhiệt'],
    [63,'Eu','Europi',151.96,9,10,'lanthanide','[Xe] 4f⁷ 6s²','+2, +3','Chất phát quang đỏ trong màn hình & tiền Euro'],
    [64,'Gd','Gađolini',157.25,9,11,'lanthanide','[Xe] 4f⁷ 5d¹ 6s²','+3','Chất tương phản chụp cộng hưởng từ MRI'],
    [65,'Tb','Tebi',158.93,9,12,'lanthanide','[Xe] 4f⁹ 6s²','+3','Chất phát quang xanh lục'],
    [66,'Dy','Điprozi',162.50,9,13,'lanthanide','[Xe] 4f¹⁰ 6s²','+3','Tăng độ bền từ trường cho động cơ xe điện'],
    [67,'Ho','Honmi',164.93,9,14,'lanthanide','[Xe] 4f¹¹ 6s²','+3','Có mômen từ nguyên tử cao nhất'],
    [68,'Er','Eribi',167.26,9,15,'lanthanide','[Xe] 4f¹² 6s²','+3','Khuếch đại tín hiệu cáp quang EDFA'],
    [69,'Tm','Tuli',168.93,9,16,'lanthanide','[Xe] 4f¹³ 6s²','+3','Nguồn tia X di động trong y khoa'],
    [70,'Yb','Ytecbi',173.05,9,17,'lanthanide','[Xe] 4f¹⁴ 6s²','+2, +3','Đồng hồ mạng quang học siêu chính xác'],
    [71,'Lu','Luteti',174.97,9,18,'lanthanide','[Xe] 4f¹⁴ 5d¹ 6s²','+3','Nguyên tố cuối họ Lantan (định tuổi thiên thạch)'],
    [72,'Hf','Hafini (Hafnium)',178.49,6,4,'transition','[Xe] 4f¹⁴ 5d² 6s²','+4','Vật liệu cổng bán dẫn High-k'],
    [73,'Ta','Tantan (Tantalum)',180.95,6,5,'transition','[Xe] 4f¹⁴ 5d³ 6s²','+5','Chịu axit cực tốt, tụ điện Tantan siêu nhỏ'],
    [74,'W','Vonfram (Tungsten)',183.84,6,6,'transition','[Xe] 4f¹⁴ 5d⁴ 6s²','+6','Nhiệt độ nóng chảy cao nhất (3422°C), dây tóc bóng đèn'],
    [75,'Re','Reni (Rhenium)',186.21,6,7,'transition','[Xe] 4f¹⁴ 5d⁵ 6s²','+4, +7','Cánh tuabin động cơ phản lực siêu nhiệt'],
    [76,'Os','Osimi (Osmium)',190.23,6,8,'transition','[Xe] 4f¹⁴ 5d⁶ 6s²','+4, +8','Kim loại có khối lượng riêng nặng nhất (22.59 g/cm³)'],
    [77,'Ir','Iriđi (Iridium)',192.22,6,9,'transition','[Xe] 4f¹⁴ 5d⁷ 6s²','+3, +4','Chống ăn mòn bậc nhất, lớp K-Pg thiên thạch'],
    [78,'Pt','Platin (Platinum)',195.08,6,10,'transition','[Xe] 4f¹⁴ 5d⁹ 6s¹','+2, +4','Bạch kim làm điện cực trơ & xúc tác'],
    [79,'Au','Vàng (Gold)',196.97,6,11,'transition','[Xe] 4f¹⁴ 5d¹⁰ 6s¹','+1, +3','Kim loại dẻo nhất, tan trong nước cường toan'],
    [80,'Hg','Thủy ngân (Mercury)',200.59,6,12,'transition','[Xe] 4f¹⁴ 5d¹⁰ 6s²','+1, +2','Kim loại duy nhất ở thể lỏng ở nhiệt độ thường'],
    [81,'Tl','Tali (Thallium)',204.38,6,13,'post','[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹','+1, +3','Kim loại mềm độc hại, thủy tinh hồng ngoại'],
    [82,'Pb','Chì (Lead)',207.2,6,14,'post','[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²','+2, +4','Tấm chắn tia X & ắc quy chì; PbS kết tủa đen'],
    [83,'Bi','Bitmut (Bismuth)',208.98,6,15,'post','[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³','+3, +5','Tinh thể cầu vồng & thuốc dạ dày Pepto-Bismol'],
    [84,'Po','Poloni',209,6,16,'metalloid','[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴','+2, +4','Nguyên tố phóng xạ do Marie Curie phát hiện'],
    [85,'At','Astatin',210,6,17,'halogen','[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵','-1, +1','Halogen hiếm nhất và có tính phóng xạ'],
    [86,'Rn','Rađon (Radon)',222,6,18,'noble','[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶','0','Khí hiếm phóng xạ nặng nhất'],
    [87,'Fr','Franxi (Francium)',223,7,1,'alkali','[Rn] 7s¹','+1','Kim loại kiềm phóng xạ cực hiếm'],
    [88,'Ra','Rađi (Radium)',226,7,2,'alkaline','[Rn] 7s²','+2','Kim loại kiềm thổ phát quang xanh lục'],
    [89,'Ac','Actini',227,10,4,'actinide','[Rn] 6d¹ 7s²','+3','Nguyên tố khởi đầu họ Actini'],
    [90,'Th','Thori (Thorium)',232.04,10,5,'actinide','[Rn] 6d² 7s²','+4','Nhiên liệu hạt nhân thế hệ mới sạch hơn U'],
    [91,'Pa','Protactini',231.04,10,6,'actinide','[Rn] 5f² 6d¹ 7s²','+5','Nguyên tố phóng xạ hiếm trong quặng urani'],
    [92,'U','Urani (Uranium)',238.03,10,7,'actinide','[Rn] 5f³ 6d¹ 7s²','+4, +6','U-235 làm nhiên liệu phản ứng phân hạch hạt nhân'],
    [93,'Np','Neptuni',237,10,8,'actinide','[Rn] 5f⁴ 6d¹ 7s²','+5','Nguyên tố siêu urani đầu tiên'],
    [94,'Pu','Plutoni',244,10,9,'actinide','[Rn] 5f⁶ 7s²','+4','Dùng trong pin RTG tàu vũ trụ Voyager'],
    [95,'Am','Amerixi',243,10,10,'actinide','[Rn] 5f⁷ 7s²','+3','Có trong cảm biến báo khói gia đình'],
    [96,'Cm','Curi (Curium)',247,10,11,'actinide','[Rn] 5f⁷ 6d¹ 7s²','+3','Máy quang phổ tia X trên xe tự hành Sao Hỏa'],
    [97,'Bk','Beckeli',247,10,12,'actinide','[Rn] 5f⁹ 7s²','+3, +4','Tổng hợp các nguyên tố siêu nặng'],
    [98,'Cf','Califoni',251,10,13,'actinide','[Rn] 5f¹⁰ 7s²','+3','Nguồn phát neutron khởi động lò hạt nhân'],
    [99,'Es','Ensteini',252,10,14,'actinide','[Rn] 5f¹¹ 7s²','+3','Đặt theo tên Albert Einstein'],
    [100,'Fm','Fecmi',257,10,15,'actinide','[Rn] 5f¹² 7s²','+3','Đặt theo tên Enrico Fermi'],
    [101,'Md','Menđelevi',258,10,16,'actinide','[Rn] 5f¹³ 7s²','+3','Vinh danh Dmitri Mendeleev - cha đẻ Bảng Tuần Hoàn'],
    [102,'No','Nobeli',259,10,17,'actinide','[Rn] 5f¹⁴ 7s²','+2, +3','Vinh danh Alfred Nobel'],
    [103,'Lr','Lorenxi',266,10,18,'actinide','[Rn] 5f¹⁴ 7s² 7p¹','+3','Nguyên tố cuối cùng của họ Actini'],
    [104,'Rf','Rozofođi',267,7,4,'transition','[Rn] 5f¹⁴ 6d² 7s²','+4','Nguyên tố siêu nặng chu kì 7'],
    [105,'Db','Đupni',268,7,5,'transition','[Rn] 5f¹⁴ 6d³ 7s²','+5','Chu kì 7 nhóm VB'],
    [106,'Sg','Sibogi',269,7,6,'transition','[Rn] 5f¹⁴ 6d⁴ 7s²','+6','Cùng nhóm với Cr, Mo, W'],
    [107,'Bh','Bori',270,7,7,'transition','[Rn] 5f¹⁴ 6d⁵ 7s²','+7','Vinh danh Niels Bohr'],
    [108,'Hs','Hasi',277,7,8,'transition','[Rn] 5f¹⁴ 6d⁶ 7s²','+8','Nguyên tố nặng chu kì 7'],
    [109,'Mt','Meitneri',278,7,9,'transition','[Rn] 5f¹⁴ 6d⁷ 7s²','—','Vinh danh nhà vật lí Lise Meitner'],
    [110,'Ds','Darmstadti',281,7,10,'transition','[Rn] 5f¹⁴ 6d⁸ 7s²','—','Tổng hợp tại GSI Darmstadt'],
    [111,'Rg','Roentgeni',282,7,11,'transition','[Rn] 5f¹⁴ 6d⁹ 7s²','—','Vinh danh Wilhelm Roentgen'],
    [112,'Cn','Copernixi',285,7,12,'transition','[Rn] 5f¹⁴ 6d¹⁰ 7s²','+2','Vinh danh Nicolaus Copernicus'],
    [113,'Nh','Nihoni',286,7,13,'post','[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹','+1','Nguyên tố đầu tiên được phát hiện tại châu Á (Nhật Bản)'],
    [114,'Fl','Flerovi',289,7,14,'post','[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²','+2','Đảo bền hạt nhân siêu nặng'],
    [115,'Mc','Moscovi',290,7,15,'post','[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³','+1, +3','Tổng hợp năm 2003 tại Dubna'],
    [116,'Lv','Livermori',293,7,16,'post','[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴','+2','Nhóm VIA chu kì 7'],
    [117,'Ts','Tennessine',294,7,17,'halogen','[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵','—','Halogen chu kì 7'],
    [118,'Og','Oganesson',294,7,18,'noble','[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶','0','Nguyên tố khí hiếm cuối cùng Z=118 trong Bảng IUPAC']
  ];

  const ELEMENTS = RAW_118.map(([z, sym, name, mass, row, col, cat, config, val, tip]) => ({
    z, sym, name, mass,
    period: row === 9 ? 6 : row === 10 ? 7 : row,
    row, col, cat, config, val, tip
  }));
  const ELEMENT_BY_Z = new Map(ELEMENTS.map(e => [e.z, e]));

  const CAT_LABELS = {
    nonmetal: 'Phi kim',
    noble: 'Khí hiếm',
    alkali: 'Kim loại kiềm',
    alkaline: 'Kiềm thổ',
    metalloid: 'Á kim',
    halogen: 'Halogen',
    transition: 'Kim loại chuyển tiếp',
    post: 'Kim loại hậu chuyển tiếp',
    lanthanide: 'Họ Lantan (4f)',
    actinide: 'Họ Actini (5f)'
  };

  // Curated fast drill pool across all subjects & 4 difficulty tiers
  const EXTRA_DRILLS = [
    { id: 'dr-toan-1', subject: 'Toán', topic: 'Hàm số & Cực trị', diff: 'Dễ', text: 'Cho hàm số $y = x^3 - 3x + 2$. Số điểm cực trị của hàm số là bao nhiêu?', options: ['0', '1', '2', '3'], answer: 'C', explanation: "$y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$, đổi dấu 2 lần nên có 2 điểm cực trị." },
    { id: 'dr-toan-2', subject: 'Toán', topic: 'Nguyên hàm - Tích phân', diff: 'TB', text: 'Tính tích phân $I = \\int_0^1 e^{2x}\\,dx$.', options: ['$\\frac{e^2 - 1}{2}$', '$e^2 - 1$', '$\\frac{e^2}{2}$', '$2(e^2 - 1)$'], answer: 'A', explanation: '$\\int_0^1 e^{2x}dx = \\left.\\frac{1}{2}e^{2x}\\right|_0^1 = \\frac{e^2 - 1}{2}$.' },
    { id: 'dr-toan-3', subject: 'Toán', topic: 'Oxyz & Khoảng cách', diff: 'Khó', text: 'Trong Oxyz, khoảng cách từ điểm $M(1;-2;3)$ đến mặt phẳng $(P): 2x - 2y + z - 5 = 0$ bằng:', options: ['4/3', '2', '3', '1'], answer: 'A', explanation: '$d(M,(P)) = \\frac{|2(1) - 2(-2) + 3 - 5|}{\\sqrt{4+4+1}} = \\frac{4}{3}$.' },
    { id: 'dr-toan-4', subject: 'Toán', topic: 'Xác suất có điều kiện', diff: 'Siêu khó', text: 'Tung 2 con xúc xắc cân đối. Biết tổng số chấm lớn hơn 8, xác suất để xuất hiện ít nhất một mặt 6 là:', options: ['7/10', '3/5', '4/5', '5/10'], answer: 'A', explanation: 'Tổng > 8 gồm 10 cặp (tổng 9,10,11,12), trong đó 7 cặp chứa mặt 6 → 7/10.' },
    { id: 'dr-li-1', subject: 'Vật lí', topic: 'Vật lí nhiệt 12', diff: 'Dễ', text: 'Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn khối chất rắn có khối lượng $m$ ở nhiệt độ nóng chảy là:', options: ['$Q = \\lambda m$', '$Q = L m$', '$Q = m c \\Delta T$', '$Q = \\frac{3}{2} n R T$'], answer: 'A', explanation: 'Công thức nhiệt nóng chảy là $Q = \\lambda m$ (với $\\lambda$ là nhiệt nóng chảy riêng).' },
    { id: 'dr-li-2', subject: 'Vật lí', topic: 'Khí lí tưởng', diff: 'TB', text: 'Đun đẳng tích một lượng khí lí tưởng từ $27^\\circ\\text{C}$ lên $127^\\circ\\text{C}$. Áp suất khí tăng thêm bao nhiêu lần?', options: ['4/3 lần', '3/4 lần', '127/27 lần', '2 lần'], answer: 'A', explanation: '$T_1 = 300\\text{ K}, T_2 = 400\\text{ K} \\Rightarrow \\frac{p_2}{p_1} = \\frac{T_2}{T_1} = \\frac{4}{3}$.' },
    { id: 'dr-li-3', subject: 'Vật lí', topic: 'Từ trường & Cảm ứng điện từ', diff: 'Khó', text: 'Suất điện động cảm ứng xuất hiện khi từ thông qua mạch biến thiên $\\Delta \\Phi = 0{,}6\\text{ Wb}$ trong $0{,}02\\text{ s}$ có độ lớn là:', options: ['30 V', '12 V', '0,012 V', '15 V'], answer: 'A', explanation: '$|e_c| = \\left|\\frac{\\Delta \\Phi}{\\Delta t}\\right| = \\frac{0,6}{0,02} = 30\\text{ V}$.' },
    { id: 'dr-hoa-1', subject: 'Hóa học', topic: 'Ester – Lipid', diff: 'Dễ', text: 'Thủy phân ethyl acetate ($\\text{CH}_3\\text{COOC}_2\\text{H}_5$) trong dung dịch NaOH đun nóng thu được muối có công thức là:', options: ['$\\text{CH}_3\\text{COONa}$', '$\\text{C}_2\\text{H}_5\\text{ONa}$', '$\\text{HCOONa}$', '$\\text{C}_2\\text{H}_5\\text{COONa}$'], answer: 'A', explanation: 'Phản ứng xà phòng hóa tạo sodium acetate ($\\text{CH}_3\\text{COONa}$) và ethanol.' },
    { id: 'dr-hoa-2', subject: 'Hóa học', topic: 'Polime & Tơ sợi', diff: 'TB', text: 'Polime nào sau đây được điều chế bằng phản ứng trùng ngưng?', options: ['Nylon-6,6', 'Polietilen (PE)', 'PVC', 'Polistiren'], answer: 'A', explanation: 'Nylon-6,6 tổng hợp bằng phản ứng trùng ngưng giữa hexamethylenediamine và axit ađipic.' },
    { id: 'dr-hoa-3', subject: 'Hóa học', topic: 'Đại cương Kim loại', diff: 'Khó', text: 'Kim loại nào sau đây tan được trong dung dịch $\\text{Fe}_2(\\text{SO}_4)_3$ dư nhưng KHÔNG tan trong dung dịch HCl loãng?', options: ['Cu', 'Fe', 'Mg', 'Al'], answer: 'A', explanation: 'Cu đứng sau H nên không tan trong HCl, nhưng khử được Fe³⁺ về Fe²⁺ theo quy tắc alpha.' },
    { id: 'dr-hoa-4', subject: 'Hóa học', topic: 'Pin điện hóa & Điện phân', diff: 'Siêu khó', text: 'Điện phân dung dịch hỗn hợp chứa $0{,}1\\text{ mol CuSO}_4$ và $0{,}2\\text{ mol NaCl}$ (điện cực trơ, màng ngăn xốp) với dòng $I = 2{,}68\\text{ A}$ trong $2\\text{ giờ}$. Tổng số mol khí thu được ở hai cực bằng:', options: ['0,15 mol', '0,10 mol', '0,20 mol', '0,12 mol'], answer: 'A', explanation: '$n_e = \\frac{2,68 \\times 7200}{96500} = 0,2\\text{ mol}$. Tại catot Cu²⁺ nhận 0,2 mol e hết vừa khít (chưa có H₂). Tại anot 0,2 mol Cl⁻ → 0,1 mol Cl₂... wait $n_{e}=0,2 \\Rightarrow Cl_2: 0,1$; nếu đề cho 0,3 mol e tương tự chú ý bán phản ứng.' },
    { id: 'dr-sinh-1', subject: 'Sinh học', topic: 'Vật chất di truyền & Nhân đôi ADN', diff: 'Dễ', text: 'Trong quá trình nhân đôi ADN, enzyme nối các đoạn Okazaki lại với nhau là:', options: ['DNA ligase', 'DNA polymerase', 'RNA polymerase', 'Helicase'], answer: 'A', explanation: 'DNA ligase xúc tác hình thành liên kết photphodieste nối các đoạn Okazaki.' },
    { id: 'dr-sinh-2', subject: 'Sinh học', topic: 'Quy luật Menđen & Di truyền học', diff: 'TB', text: 'Phép lai AaBb × AaBb (các gen trội hoàn toàn, phân li độc lập) cho tối đa bao nhiêu loại kiểu hình ở F1?', options: ['4', '9', '2', '3'], answer: 'A', explanation: 'Mỗi cặp cho 2 kiểu hình → 2 × 2 = 4 loại kiểu hình.' },
    { id: 'dr-anh-1', subject: 'Tiếng Anh', topic: 'Ngữ pháp Thì & Câu điều kiện', diff: 'Dễ', text: 'By the time we arrived at the hall, the chemistry workshop ______.', options: ['had already started', 'already starts', 'is starting', 'was start'], answer: 'A', explanation: '"By the time + QKĐ" → mệnh đề chính chia Quá khứ hoàn thành (had + V3/ed).' },
    { id: 'dr-anh-2', subject: 'Tiếng Anh', topic: 'Từ vựng & Collocations THPT', diff: 'TB', text: 'Students should ______ advantage of the spaced repetition notebook to remember tricky formulas.', options: ['take', 'make', 'do', 'bring'], answer: 'A', explanation: 'Collocation chuẩn: "take advantage of" (tận dụng).' },
    { id: 'dr-su-1', subject: 'Lịch sử', topic: 'Lịch sử Việt Nam 1945–1975', diff: 'Dễ', text: 'Chiến dịch nào đã làm phá sản hoàn toàn kế hoạch Nava của thực dân Pháp năm 1954?', options: ['Điện Biên Phủ', 'Việt Bắc Thu - Đông', 'Biên giới Thu - Đông', 'Hồ Chí Minh'], answer: 'A', explanation: 'Chiến thắng Điện Biên Phủ (7/5/1954) đập tan hoàn toàn kế hoạch Nava.' }
  ];

  // Fix dr-hoa-4 numeric explanation carefully: 2.68*10800 = 3h -> 0.3 mol e, let's adjust option/duration to exact 0.10 mol so math is 100% rigorous!
  EXTRA_DRILLS.forEach(q => {
    if (q.id === 'dr-hoa-4') {
      q.text = 'Điện phân dung dịch chứa $0{,}1\\text{ mol CuSO}_4$ và $0{,}1\\text{ mol KCl}$ (điện cực trơ, màng ngăn) đến khi catot bắt đầu thoát khí thì dừng lại. Số mol khí thu được ở anot là:';
      q.options = ['0,075 mol', '0,050 mol', '0,100 mol', '0,025 mol'];
      q.answer = 'A';
      q.explanation = 'Catot ngừng vừa hết Cu²⁺ → $n_e = 0,2\\text{ mol}$. Ở anot: $0,1\\text{ mol Cl}^- \\rightarrow 0,05\\text{ mol Cl}_2$ (0,1e), còn $0,1\\text{ mol e}$ điện phân H₂O tạo $0,025\\text{ mol O}_2$. Tổng khí anot = $0,05 + 0,025 = 0,075\\text{ mol}$.';
    }
  });

  const ISLANDS = [
    { id: 'island-toan', name: 'Đảo Giải Tích & Oxyz', subject: 'Toán', icon: '📐', desc: 'Cực trị hàm số, Tích phân & Hình học không gian Oxyz.' },
    { id: 'island-hoa', name: 'Đảo Hữu Cơ & 118 Nguyên Tố', subject: 'Hóa học', icon: '⚗️', desc: 'Ester, Polime, Pin điện hóa & Kim loại trọng tâm.' },
    { id: 'island-li', name: 'Đảo Nhiệt Học & Từ Trường', subject: 'Vật lí', icon: '⚡', desc: 'Vật lí nhiệt, Khí lí tưởng & Cảm ứng điện từ.' },
    { id: 'island-sinh', name: 'Đảo Di Truyền & Sinh Thái', subject: 'Sinh học', icon: '🧬', desc: 'ADN, Đột biến & Quy luật phân li Độc lập.' },
    { id: 'island-anh', name: 'Đảo Global Success 12', subject: 'Tiếng Anh', icon: '🌍', desc: 'Ngữ pháp trọng tâm, Đảo ngữ & Collocations THPT.' },
    { id: 'island-su', name: 'Đảo Sử Việt Nam Hiện Đại', subject: 'Lịch sử', icon: '🏛️', desc: 'Các chiến dịch lịch sử & Phong trào cách mạng.' },
    { id: 'island-dgnl', name: 'Đảo ĐGNL HSA / V-ACT', subject: 'Tất cả', icon: '🚀', desc: 'Tổng hợp đa môn rèn tốc độ 60 giây/câu.' }
  ];

  const SUBJECT_MAP = { math: 'Toán', physics: 'Vật lí', chemistry: 'Hóa học', biology: 'Sinh học', english: 'Tiếng Anh', history: 'Lịch sử' };

  const RPG_UI = {
    // Subtabs
    missionTab: 'practice', // 'practice' | 'srs' | 'guide'
    practiceSubj: 'Tất cả',
    practiceDiff: 'Tất cả',
    practiceCount: 5,
    quizSession: null, // { mode, islandId, questions, idx, picked, results, startTs, finished }

    shopTab: 'shop', // 'shop' | 'inventory'
    shopCat: 'ALL',

    ptMode: 'lookup', // 'lookup' | 'gacha'
    ptSearch: '',
    ptSelectedZ: 6,

    journeyData: { week_key: '', grade: '2K9', leaders: [] },
    catalog: [],
    tiers: [],
    guestRpg: null
  };

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function typeset(el) {
    if (!el || !window.MathJax || typeof window.MathJax.typesetPromise !== 'function') return;
    if (document.documentElement.classList.contains('pk9-mathjax-ready') || window.MathJax.startup?.document) {
      window.MathJax.typesetPromise([el]).catch(() => {});
    }
  }

  function toast(msg, type = 'info') {
    if (typeof window.PK9_TOAST === 'function') window.PK9_TOAST(msg, type);
  }

  function getCsrfToken() {
    if (typeof window.PK9_GET_CSRF === 'function') return window.PK9_GET_CSRF();
    const m = document.cookie.match(/(?:^|;\s*)phuc_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function defaultGuestState() {
    try {
      const saved = JSON.parse(localStorage.getItem('pk9_rpg_guest') || 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch {}
    return {
      gold: 180,
      diamonds: 5,
      tier: { name: 'Bậc Đồng', icon: '🥉', color: '#b45309' },
      equipped: { outfit: 'outfit-scholar', frame: 'frame-bronze', title: 'title-tanbinh', cardbg: 'cardbg-ocean', pet: null },
      equipped_details: {
        outfit: { id: 'outfit-scholar', name: 'Áo Blouse Thủ Khoa', icon: '🧑‍🎓' },
        frame: { id: 'frame-bronze', name: 'Khung Tân Binh Đồng', icon: '🥉', cssClass: 'pk9-frame-bronze' },
        title: { id: 'title-tanbinh', name: 'Tân Binh Bứt Phá', icon: '⚡' },
        cardbg: { id: 'cardbg-ocean', name: 'Nền Đại Dương Xanh', icon: '🌊', cssClass: 'pk9-cardbg-ocean' },
        pet: null
      },
      inventory: ['outfit-scholar', 'frame-bronze', 'title-tanbinh', 'cardbg-ocean'],
      consumables: { xp_boost: 0, gold_charm: 0 },
      checkin: { checked_today: false, total_days: 0 },
      daily: { date: '', practice_count: 0, srs_count: 0, exam_count: 0, study_count: 0, gold_earned_today: 0, xp_earned_today: 0, claimed: {} },
      missions: [
        { id: 'practice_2', title: 'Hoàn thành 2 lượt Luyện Nhiệm Vụ', target: 2, progress: 0, gold: 30, xp: 15, diamonds: 0, completed: false, claimed: false },
        { id: 'srs_5', title: 'Ôn tập 5 câu trong Sổ Ôn Tập', target: 5, progress: 0, gold: 25, xp: 15, diamonds: 0, completed: false, claimed: false },
        { id: 'exam_1', title: 'Nộp 1 bài trong Kho Luyện Đề', target: 1, progress: 0, gold: 50, xp: 20, diamonds: 1, completed: false, claimed: false },
        { id: 'study_1', title: 'Học 1 Bài giảng Video hoặc Flashcard', target: 1, progress: 0, gold: 20, xp: 10, diamonds: 0, completed: false, claimed: false }
      ],
      paper_theme: 'paper-ivory',
      motto: 'Mục tiêu 27+ điểm Đại Học 2026',
      sbd: 'K9-GUEST',
      periodic: { unlocked: [1, 6, 8], unlocked_count: 3, tickets: 1, next_ticket_in: 7 },
      bookmarks: [],
      srs: { total: 0, due_count: 0, items: [] },
      flashcards_state: {},
      journey: {},
      questions_conquered: 0
    };
  }

  function getRpgState() {
    if (window.PK9_RPG_STATE && typeof window.PK9_RPG_STATE === 'object') {
      return window.PK9_RPG_STATE;
    }
    if (!RPG_UI.guestRpg) RPG_UI.guestRpg = defaultGuestState();
    return RPG_UI.guestRpg;
  }

  function applyRpgUpdate(newRpg, extra = {}) {
    if (newRpg && typeof newRpg === 'object') {
      window.PK9_RPG_STATE = newRpg;
      try {
        if (newRpg.paper_theme) localStorage.setItem('pk9_paper_theme', newRpg.paper_theme);
        if (Array.isArray(newRpg.bookmarks)) localStorage.setItem('pk9_rpg_bookmarks', JSON.stringify(newRpg.bookmarks));
      } catch {}
    }
    if (typeof window.PK9_ON_RPG_SYNC === 'function') {
      window.PK9_ON_RPG_SYNC(newRpg, extra);
    }
    renderActiveRpgTab();
  }
  window.PK9_APPLY_RPG_UPDATE = applyRpgUpdate;

  async function rpgPost(action, body = {}) {
    const resp = await fetch(`/api/dashboard?action=${encodeURIComponent(action)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
      body: JSON.stringify(body)
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 401) {
      toast('Hãy đăng nhập hoặc tạo tài khoản (10 giây) để đồng bộ phần thưởng lên máy chủ!', 'warning');
      if (typeof window.PK9_OPEN_AUTH === 'function') window.PK9_OPEN_AUTH('register');
      return { ok: false, unauth: true };
    }
    if (!resp.ok || !data?.ok) {
      toast(data?.message || 'Thao tác chưa hoàn thành.', 'error');
      if (data?.rpg) applyRpgUpdate(data.rpg);
      return { ok: false, data };
    }
    if (data.message) toast(data.message, 'success');
    if (data.journey) RPG_UI.journeyData = data.journey;
    applyRpgUpdate(data.rpg, { xp: data.xp, weekly_xp: data.weekly_xp });
    if (['rpg-checkin', 'rpg-claim-mission', 'rpg-practice-finish', 'rpg-journey-submit', 'rpg-equip'].includes(action)) {
      if (typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
        window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true });
      }
    }
    return { ok: true, data };
  }

  async function loadRpgMeta(grade = '2K9') {
    try {
      const resp = await fetch(`/api/dashboard?action=rpg-state&grade=${encodeURIComponent(grade)}`, { credentials: 'include' });
      if (!resp.ok) return;
      const data = await resp.json();
      if (Array.isArray(data?.catalog)) RPG_UI.catalog = data.catalog;
      if (Array.isArray(data?.tiers)) RPG_UI.tiers = data.tiers;
      if (data?.journey) RPG_UI.journeyData = data.journey;
      if (data?.user_rpg) applyRpgUpdate(data.user_rpg);
    } catch {}
  }

  // Extract question pool from PK9_SEED_EXAMS + EXTRA_DRILLS cleanly
  function buildQuestionPool() {
    const out = [...EXTRA_DRILLS];
    const seedExams = Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS : [];
    for (const ex of seedExams) {
      const sName = SUBJECT_MAP[String(ex.subject || '').toLowerCase()] || ex.subject || 'Tổng hợp';
      for (const q of (ex.questions || [])) {
        if (String(q.type || 'mcq').toLowerCase() !== 'mcq' || !Array.isArray(q.options) || q.options.length < 2) continue;
        const nNum = Number(q.number || 1);
        const diff = nNum <= 4 ? 'Dễ' : nNum <= 8 ? 'TB' : nNum <= 11 ? 'Khó' : 'Siêu khó';
        out.push({
          id: String(q.id),
          subject: sName,
          topic: q.topic || ex.title || 'Chuyên đề THPT',
          diff,
          text: q.text || q.prompt || '',
          options: q.options.map(o => (typeof o === 'object' && o !== null ? o.text : String(o))),
          optionKeys: q.options.map((o, idx) => (typeof o === 'object' && o !== null && o.key ? o.key : ['A', 'B', 'C', 'D'][idx])),
          answer: String(q.answer || 'A').toUpperCase(),
          explanation: q.explanation || 'Xem hướng dẫn giải chi tiết trong Đề thi nguồn chuẩn.'
        });
      }
    }
    return out;
  }

  // Deterministic 21x21 QR SVG matrix (with authentic 3 finder squares & timing lines)
  function buildQrSvg(codeText, size = 148) {
    const N = 21;
    const grid = Array.from({ length: N }, () => Array(N).fill(false));
    const fixed = Array.from({ length: N }, () => Array(N).fill(false));

    function drawFinder(r0, c0) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = r0 + r, cc = c0 + c;
          if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
          fixed[rr][cc] = true;
          if (r === -1 || r === 7 || c === -1 || c === 7) grid[rr][cc] = false;
          else if (r === 0 || r === 6 || c === 0 || c === 6) grid[rr][cc] = true;
          else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) grid[rr][cc] = true;
          else grid[rr][cc] = false;
        }
      }
    }
    drawFinder(0, 0);
    drawFinder(0, N - 7);
    drawFinder(N - 7, 0);

    for (let i = 8; i < N - 8; i++) {
      fixed[6][i] = true; grid[6][i] = i % 2 === 0;
      fixed[i][6] = true; grid[i][6] = i % 2 === 0;
    }

    let seed = 2166136261;
    const s = String(codeText || 'PHUCK9');
    for (let i = 0; i < s.length; i++) {
      seed ^= s.charCodeAt(i);
      seed = Math.imul(seed, 16777619) >>> 0;
    }

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (fixed[r][c]) continue;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        grid[r][c] = ((seed >>> 24) & 1) === 1;
      }
    }

    const cell = size / (N + 2);
    let rects = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c]) {
          const x = ((c + 1) * cell).toFixed(2);
          const y = ((r + 1) * cell).toFixed(2);
          const w = (cell + 0.15).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#0f172a"/>`;
        }
      }
    }
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="pk9-qr-svg" role="img" aria-label="Mã QR học viên">${'<rect width="100%" height="100%" rx="10" fill="#ffffff"/>'}${rects}</svg>`;
  }

  function renderCurrencyStrip(rpg) {
    return `
      <div class="pk9-rpg-wallet">
        <span class="pk9-wallet-pill gold" title="Vàng học tập dùng mua vật phẩm & mở ô Tuần Hoàn">🪙 <b>${rpg.gold ?? 180}</b> Vàng</span>
        <span class="pk9-wallet-pill diamond" title="Kim cương cao cấp dùng mở vật phẩm Huyền Thoại">💎 <b>${rpg.diamonds ?? 5}</b> Kim cương</span>
        <span class="pk9-wallet-pill" title="Lượt nhân đôi EXP còn lại">🚀 x2 EXP: <b>${rpg.consumables?.xp_boost || 0}</b></span>
        <span class="pk9-wallet-pill" title="Lượt Bùa +25% Vàng còn lại">🧿 Bùa Vàng: <b>${rpg.consumables?.gold_charm || 0}</b></span>
      </div>
    `;
  }

  // Render compact RPG Hero Bar inside tab-home
  function renderHomeRpgWidget(user, isAdmin) {
    const rpg = getRpgState();
    const xpVal = user ? (isAdmin ? 0 : Math.max(100, Number(user.xp || 100))) : 0;
    const eq = rpg.equipped_details || {};
    const tier = rpg.tier || { name: 'Bậc Đồng', icon: '🥉' };
    const dueCount = Number(rpg.srs?.due_count || 0);
    const ptUnlocked = Number(rpg.periodic?.unlocked_count || 3);
    const checkedToday = Boolean(rpg.checkin?.checked_today);
    const firstOpenMission = (rpg.missions || []).find(m => m.completed && !m.claimed);

    return `
      <div class="pk9-rpg-home-banner">
        <div class="pk9-rpg-home-avatar-col">
          <div class="pk9-rpg-avatar-box ${esc(eq.frame?.cssClass || 'pk9-frame-bronze')}" data-nav-tab="idcard" title="Xem Nhân vật & Thẻ QR">
            <span class="pk9-rpg-outfit">${eq.outfit?.icon || '🧑‍🎓'}</span>
            ${eq.pet?.icon ? `<span class="pk9-rpg-pet-badge" title="${esc(eq.pet.name)}">${eq.pet.icon}</span>` : ''}
          </div>
          <div style="min-width:0;">
            <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
              <strong style="font-size:0.96rem;">${esc(user?.display_name || 'Khách Học Tập K9')}</strong>
              <span class="pk9-badge pk9-badge-subj">${tier.icon} ${esc(tier.name)}</span>
              ${eq.title ? `<span class="pk9-badge pk9-badge-code">${eq.title.icon} ${esc(eq.title.name)}</span>` : ''}
            </div>
            <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin-top:0.2rem;">
              ${user ? `SBD: <b>${esc(rpg.sbd || 'K9')}</b> • Đã chinh phục <b>${rpg.questions_conquered || 0}</b> câu hỏi • Bảng tuần hoàn: <b>${ptUnlocked}/118</b>` : '🔒 <b>Chế độ Khách (BXH đang khóa)</b> — Đăng ký miễn phí để mở khóa BXH, giữ 180 Vàng & 5 Kim cương!'}
            </div>
            ${renderCurrencyStrip(rpg)}
          </div>
        </div>
        <div class="pk9-rpg-home-actions">
          <button type="button" class="pk9-btn-exam-primary pk9-rpg-checkin-btn ${checkedToday ? 'is-done' : ''}" data-rpg-checkin="1">
            ${checkedToday ? '✅ Đã Điểm Danh <span class="pk9-hide-mob-xs">Hôm Nay</span>' : '🎁 Điểm Danh Quà 24h <span class="pk9-hide-mob-xs">(+30🪙 · +1💎)</span>'}
          </button>
          <div class="pk9-rpg-quick-links">
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="missions">
              ⚡ Luyện Nhiệm Vụ ${dueCount > 0 ? `<span class="pk9-dot-pill">${dueCount}</span>` : ''}
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="shop">
              🛍️ Cửa Hàng
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="periodic">
              ⚗️ Tuần Hoàn (${ptUnlocked}/118)
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="journey">
              🗺️ Vượt Đảo ${firstOpenMission ? '🔥' : ''}
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="idcard">
              🪪 Thẻ Học Viên QR
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ========================================================================
  // TAB A: LUYỆN NHIỆM VỤ & SỔ ÔN TẬP (SPACED REPETITION)
  // ========================================================================
  function renderMissionsTab() {
    const root = document.getElementById('tab-missions');
    if (!root) return;
    const rpg = getRpgState();
    const srsItems = rpg.srs?.items || [];
    const nowMs = Date.now();
    const dueItems = srsItems.filter(it => Number(it.dueAt || 0) <= nowMs);

    // If an active practice/srs session is running
    if (RPG_UI.quizSession && ['practice', 'srs'].includes(RPG_UI.quizSession.mode)) {
      root.innerHTML = renderQuizRunnerHtml(RPG_UI.quizSession);
      typeset(root);
      return;
    }

    const subjects = ['Tất cả', 'Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Lịch sử'];
    const diffs = ['Tất cả', 'Dễ', 'TB', 'Khó', 'Siêu khó'];
    const pool = buildQuestionPool().filter(q =>
      (RPG_UI.practiceSubj === 'Tất cả' || q.subject === RPG_UI.practiceSubj) &&
      (RPG_UI.practiceDiff === 'Tất cả' || q.diff === RPG_UI.practiceDiff)
    );

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <div style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.28rem 0.78rem;border-radius:999px;background:rgba(56,189,248,0.2);font-size:0.75rem;font-weight:800;margin-bottom:0.65rem;">
                ⚡ LUYỆN NHIỆM VỤ & SỔ ÔN TẬP NGẮT QUÃNG (SRS)
              </div>
              <h2 style="margin:0 0 0.45rem;font-size:1.5rem;font-weight:900;">Luyện Theo Chuyên Đề • Trả Lời Sai Lên Lịch Ôn Tự Động</h2>
              <p style="margin:0;color:rgba(255,255,255,0.86);font-size:0.9rem;">
                Chọn môn học & độ khó để cày Vàng + EXP hàng ngày. Câu nào làm sai hệ thống sẽ đưa thẳng vào <b>Sổ Ôn Tập</b> để ôn lại ngay, câu đúng tự giãn lịch 1 → 3 → 7 → 14 → 30 ngày!
              </p>
            </div>
            <div>${renderCurrencyStrip(rpg)}</div>
          </div>
        </div>

        <!-- 4 DAILY MISSIONS -->
        <div class="pk9-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
            <h3 style="margin:0;font-size:1.05rem;font-weight:900;">🎯 Nhiệm Vụ Hôm Nay</h3>
            <span style="font-size:0.78rem;color:var(--pk9-text-muted);">Hôm nay đã kiếm: 🪙 +${rpg.daily?.gold_earned_today || 0} Vàng · ⚡ +${rpg.daily?.xp_earned_today || 0} EXP</span>
          </div>
          <div class="pk9-missions-grid">
            ${(rpg.missions || []).map(m => {
              const pct = Math.min(100, Math.round(((m.progress || 0) / Math.max(1, m.target)) * 100));
              return `
                <div class="pk9-mission-card ${m.claimed ? 'claimed' : m.completed ? 'ready' : ''}">
                  <div style="font-weight:800;font-size:0.88rem;">${esc(m.title)}</div>
                  <div style="font-size:0.76rem;color:var(--pk9-text-muted);margin:0.25rem 0 0.5rem;">
                    Thưởng: <b>+${m.gold} 🪙</b>${m.diamonds ? ` · <b>+${m.diamonds} 💎</b>` : ''} · <b>+${m.xp} ⚡EXP</b>
                  </div>
                  <div class="pk9-topic-track" style="height:0.42rem;margin-bottom:0.45rem;">
                    <div class="pk9-topic-fill" style="width:${pct}%;"></div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.76rem;">
                    <span>Tiến độ: <b>${m.progress}/${m.target}</b></span>
                    ${m.claimed ? '<span class="pk9-badge pk9-badge-verified">✓ Đã nhận</span>'
                      : m.completed ? `<button type="button" class="pk9-admin-btn-xs" data-rpg-claim="${esc(m.id)}" style="background:#10b981;color:#fff;border:none;">🎁 Nhận quà</button>`
                      : '<span style="color:var(--pk9-text-muted);">Đang thực hiện</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            <button type="button" class="pk9-exam-chip ${RPG_UI.missionTab === 'practice' ? 'active' : ''}" data-rpg-mtab="practice">⚡ Luyện Nhiệm Vụ</button>
            <button type="button" class="pk9-exam-chip ${RPG_UI.missionTab === 'srs' ? 'active' : ''}" data-rpg-mtab="srs">📒 Sổ Ôn Tập (${dueItems.length} đến hạn / ${srsItems.length})</button>
            <button type="button" class="pk9-exam-chip ${RPG_UI.missionTab === 'guide' ? 'active' : ''}" data-rpg-mtab="guide">🧭 Cẩm Nang Chỉ Số</button>
          </div>
        </div>

        ${RPG_UI.missionTab === 'practice' ? `
          <div class="pk9-card">
            <h4 style="margin:0 0 0.75rem;font-size:1rem;font-weight:900;">🎮 Em Muốn Luyện Phần Nào? (${pool.length} câu sẵn sàng)</h4>
            <div style="display:flex;flex-direction:column;gap:0.85rem;">
              <div>
                <div style="font-size:0.78rem;font-weight:800;margin-bottom:0.35rem;color:var(--pk9-text-muted);">1. CHỌN MÔN HỌC:</div>
                <div class="pk9-exam-tabs">
                  ${subjects.map(s => `<button type="button" class="pk9-exam-chip ${RPG_UI.practiceSubj === s ? 'active' : ''}" data-pr-subj="${esc(s)}">${esc(s)}</button>`).join('')}
                </div>
              </div>
              <div>
                <div style="font-size:0.78rem;font-weight:800;margin-bottom:0.35rem;color:var(--pk9-text-muted);">2. CHỌN ĐỘ KHÓ:</div>
                <div class="pk9-exam-tabs">
                  ${diffs.map(d => `<button type="button" class="pk9-exam-chip ${RPG_UI.practiceDiff === d ? 'active' : ''}" data-pr-diff="${esc(d)}">${esc(d)}</button>`).join('')}
                </div>
              </div>
              <div>
                <div style="font-size:0.78rem;font-weight:800;margin-bottom:0.35rem;color:var(--pk9-text-muted);">3. SỐ CÂU MỖI LƯỢT:</div>
                <div class="pk9-exam-tabs">
                  ${[5, 8, 12].map(n => `<button type="button" class="pk9-exam-chip ${RPG_UI.practiceCount === n ? 'active' : ''}" data-pr-count="${n}">${n} câu</button>`).join('')}
                </div>
              </div>
              <div>
                <button type="button" class="pk9-btn-exam-primary" data-start-practice="practice" ${pool.length ? '' : 'disabled'}>
                  🚀 BẮT ĐẦU LUYỆN NGAY (${Math.min(RPG_UI.practiceCount, pool.length)} câu)
                </button>
              </div>
            </div>
          </div>
        ` : RPG_UI.missionTab === 'srs' ? `
          <div class="pk9-card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.85rem;">
              <div>
                <h4 style="margin:0;font-size:1.02rem;font-weight:900;">📒 Sổ Ôn Tập Ngắt Quãng (Spaced Repetition)</h4>
                <p style="margin:0.2rem 0 0;font-size:0.82rem;color:var(--pk9-text-muted);">
                  Có <b>${dueItems.length}</b> câu đang đến hạn cần ôn ngay hôm nay trong tổng số <b>${srsItems.length}</b> câu đã theo dõi.
                </p>
              </div>
              <button type="button" class="pk9-btn-exam-primary" data-start-practice="srs">
                🔥 Ôn Ngay (${dueItems.length ? `${Math.min(10, dueItems.length)} câu đến hạn` : 'Ôn lại câu cũ'})
              </button>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.45rem;">
              ${srsItems.length ? srsItems.slice(0, 20).map(item => {
                const isDue = Number(item.dueAt || 0) <= nowMs;
                const dueLabel = isDue ? '🔴 Đến hạn ôn ngay' : `🟢 Ôn sau ${item.intervalDays || 1} ngày`;
                return `
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;padding:0.55rem 0.75rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);font-size:0.82rem;">
                    <div style="min-width:0;flex:1;">
                      <b>${esc(item.subject || 'Tổng hợp')}</b> • ${esc(item.topic || item.id)}
                      <span style="color:var(--pk9-text-muted);font-size:0.74rem;"> • Đúng liên tiếp: ${item.reps || 0} • Lỗi: ${item.lapses || 0}</span>
                    </div>
                    <span class="pk9-badge ${isDue ? 'pk9-badge-hot' : 'pk9-badge-verified'}">${dueLabel}</span>
                  </div>
                `;
              }).join('') : `
                <div style="padding:1.5rem;text-align:center;color:var(--pk9-text-muted);font-size:0.86rem;">
                  Sổ Ôn Tập còn trống — hãy hoàn thành 1 lượt Luyện Nhiệm Vụ hoặc nộp 1 Đề thi để hệ thống tự lên lịch ôn tập!
                </div>
              `}
            </div>
          </div>
        ` : `
          <div class="pk9-card">
            <h4 style="margin:0 0 0.75rem;font-size:1.05rem;font-weight:900;">🧭 Cẩm Nang Cơ Chế Phúc K9 RPG</h4>
            <div class="pk9-missions-grid">
              <div class="pk9-mission-card"><b>⚡ EXP & Bậc Xếp Hạng</b><p style="font-size:0.82rem;color:var(--pk9-text-muted);margin:0.35rem 0 0;">Làm đề (+60→140 XP), Luyện nhiệm vụ (+10→45 XP), Học video (+25 XP) để thăng từ Bậc Đồng → Huyền Thoại & leo BXH Tuần.</p></div>
              <div class="pk9-mission-card"><b>🪙 Vàng & 💎 Kim Cương</b><p style="font-size:0.82rem;color:var(--pk9-text-muted);margin:0.35rem 0 0;">Kiếm qua Điểm danh 24h, Nhiệm vụ ngày, Luyện đề & Vượt Đảo. Dùng mở Bảng Tuần Hoàn & mua Khung/Thú cưng/Danh hiệu.</p></div>
              <div class="pk9-mission-card"><b>📒 Sổ Ôn Tập SRS</b><p style="font-size:0.82rem;color:var(--pk9-text-muted);margin:0.35rem 0 0;">Câu sai lên lịch ôn ngay lập tức; trả lời đúng giãn lịch 1 → 3 → 7 → 14 → 30 ngày giúp nhớ sâu công thức.</p></div>
              <div class="pk9-mission-card"><b>🧪 Bảng Tuần Hoàn 118 Ô</b><p style="font-size:0.82rem;color:var(--pk9-text-muted);margin:0.35rem 0 0;">Tra cứu tự do 118 nguyên tố IUPAC, đồng thời mở khóa gacha (120 Vàng/ô); mỗi 10 ô nhận thêm 1 Vé Chọn + 1 Kim Cương!</p></div>
            </div>
          </div>
        `}
      </div>
    `;
  }

  function renderQuizRunnerHtml(sess) {
    if (sess.finished) {
      const okCount = sess.results.filter(r => r.correct).length;
      return `
        <div class="pk9-card" style="text-align:center;padding:2rem 1.25rem;">
          <div style="font-size:2.6rem;margin-bottom:0.4rem;">🎉</div>
          <h3 style="margin:0 0 0.4rem;font-size:1.35rem;font-weight:900;">Hoàn Thành Lượt ${sess.mode === 'journey' ? 'Vượt Đảo' : sess.mode === 'srs' ? 'Sổ Ôn Tập' : 'Luyện Nhiệm Vụ'}!</h3>
          <p style="font-size:0.95rem;color:var(--pk9-text-muted);margin:0 0 1.2rem;">
            Bạn trả lời đúng <b>${okCount}/${sess.questions.length}</b> câu hỏi. Tiến trình & phần thưởng đã được ghi nhận!
          </p>
          <button type="button" class="pk9-btn-exam-primary" data-close-quiz-sess="1">← Quay lại</button>
        </div>
      `;
    }

    const q = sess.questions[sess.idx];
    const picked = sess.picked;
    const isAnswered = Boolean(picked);
    const ansKey = String(q.answer || 'A').toUpperCase();
    const keys = q.optionKeys || ['A', 'B', 'C', 'D'];

    return `
      <div class="pk9-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.85rem;">
          <span class="pk9-badge pk9-badge-subj">📘 ${esc(q.subject)} • ${esc(q.diff || 'Chuẩn')} • Câu ${sess.idx + 1}/${sess.questions.length}</span>
          <button type="button" class="pk9-btn-exam-ghost" data-close-quiz-sess="1" style="padding:0.3rem 0.7rem;font-size:0.78rem;">✕ Dừng lượt</button>
        </div>
        <div style="font-size:0.82rem;color:var(--pk9-text-muted);margin-bottom:0.35rem;">📌 Chuyên đề: ${esc(q.topic)}</div>
        <div style="font-size:1.02rem;font-weight:700;line-height:1.55;margin-bottom:0.95rem;">${esc(q.text)}</div>
        <div class="pk9-mcq-list">
          ${(q.options || []).map((optText, i) => {
            const k = String(keys[i] || ['A', 'B', 'C', 'D'][i]).toUpperCase();
            let cls = '';
            if (isAnswered) {
              if (k === ansKey) cls = 'correct';
              else if (k === picked) cls = 'wrong';
            }
            return `
              <button type="button" class="pk9-mcq-opt ${cls}" ${isAnswered ? 'disabled' : ''} data-rpg-pick="${esc(k)}">
                <span class="pk9-mcq-letter">${esc(k)}</span>
                <div style="flex:1;text-align:left;">${esc(optText)}</div>
              </button>
            `;
          }).join('')}
        </div>
        ${isAnswered ? `
          <div style="margin-top:0.95rem;padding:0.85rem;border-radius:0.85rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);font-size:0.86rem;">
            <div style="font-weight:800;margin-bottom:0.25rem;color:${picked === ansKey ? '#059669' : '#dc2626'};">
              ${picked === ansKey ? '✓ Chính xác! Lịch SRS đã giãn ra.' : `✗ Chưa đúng (Đáp án: ${ansKey}). Câu này đã vào Sổ Ôn Tập ngay!`}
            </div>
            <div style="color:var(--pk9-text-muted);">${esc(q.explanation)}</div>
            <div style="margin-top:0.75rem;">
              <button type="button" class="pk9-btn-exam-primary" data-rpg-next-q="1">
                ${sess.idx + 1 < sess.questions.length ? 'Câu tiếp theo →' : '✅ Hoàn thành & Nhận thưởng'}
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ========================================================================
  // TAB B: CỬA HÀNG & TÚI ĐỒ (SHOP & INVENTORY)
  // ========================================================================
  function renderShopTab() {
    const root = document.getElementById('tab-shop');
    if (!root) return;
    const rpg = getRpgState();
    const items = RPG_UI.catalog.length ? RPG_UI.catalog : [];
    const invSet = new Set(rpg.inventory || []);
    const eq = rpg.equipped || {};

    const cats = [
      { id: 'ALL', label: '🔥 Tất cả' },
      { id: 'outfit', label: '👕 Trang phục' },
      { id: 'frame', label: '🖼️ Khung Avatar' },
      { id: 'pet', label: '🐾 Thú cưng' },
      { id: 'title', label: '🏅 Danh hiệu' },
      { id: 'cardbg', label: '🪪 Nền Thẻ QR' },
      { id: 'consumable', label: '⚡ Vật phẩm' }
    ];

    const list = items.filter(it => {
      if (RPG_UI.shopTab === 'inventory' && !invSet.has(it.id)) return false;
      if (RPG_UI.shopCat !== 'ALL' && it.category !== RPG_UI.shopCat) return false;
      return true;
    });

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <h2 style="margin:0 0 0.45rem;font-size:1.5rem;font-weight:900;">🛍️ Cửa Hàng Trang Bị & 🎒 Túi Đồ Học Viên</h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.9rem;">
                Dùng Vàng & Kim cương kiếm từ việc học để mở khóa Khung Avatar nổi bật trên BXH, Thú cưng, Danh hiệu, Nền Thẻ QR và Bùa Nhân Đôi EXP!
              </p>
            </div>
            <div>${renderCurrencyStrip(rpg)}</div>
          </div>
        </div>

        <div class="pk9-card" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.75rem;">
          <div>
            <div style="font-weight:900;font-size:0.95rem;">💱 Quầy Quy Đổi Vàng ⇄ Kim Cương</div>
            <div style="font-size:0.78rem;color:var(--pk9-text-muted);">Tỉ giá chuẩn: <b>1 💎 = 50 🪙 Vàng</b> • <b>100 🪙 Vàng = 2 💎</b></div>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button type="button" class="pk9-btn-exam-ghost" data-rpg-convert="diamond_to_gold">💎 Đổi 1 Kim cương → +50 Vàng</button>
            <button type="button" class="pk9-btn-exam-ghost" data-rpg-convert="gold_to_diamond">🪙 Đổi 100 Vàng → +2 Kim cương</button>
          </div>
        </div>

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            <button type="button" class="pk9-exam-chip ${RPG_UI.shopTab === 'shop' ? 'active' : ''}" data-shop-tab="shop">🛍️ Cửa Hàng (${items.length})</button>
            <button type="button" class="pk9-exam-chip ${RPG_UI.shopTab === 'inventory' ? 'active' : ''}" data-shop-tab="inventory">🎒 Túi Đồ (${invSet.size})</button>
            ${cats.map(c => `<button type="button" class="pk9-exam-chip ${RPG_UI.shopCat === c.id ? 'active' : ''}" data-shop-cat="${c.id}">${c.label}</button>`).join('')}
          </div>
        </div>

        <div class="pk9-shop-grid">
          ${list.map(it => {
            const owned = !it.consumable && invSet.has(it.id);
            const equipped = owned && eq[it.category] === it.id;
            const priceLabel = it.price === 0 ? 'Miễn phí' : it.currency === 'diamonds' ? `💎 ${it.price} Kim cương` : `🪙 ${it.price} Vàng`;
            return `
              <article class="pk9-shop-card ${equipped ? 'equipped' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
                  <div class="pk9-shop-icon ${esc(it.cssClass || '')}">${it.icon}</div>
                  <span class="pk9-badge pk9-rarity-${esc(it.rarity || 'common')}">${esc((it.rarity || 'common').toUpperCase())}</span>
                </div>
                <div style="font-weight:900;font-size:0.95rem;margin-top:0.55rem;">${esc(it.name)}</div>
                <div style="font-size:0.78rem;color:var(--pk9-text-muted);line-height:1.45;flex:1;margin:0.25rem 0 0.7rem;">${esc(it.desc)}</div>
                <div class="pk9-shop-foot">
                  <span class="pk9-shop-price" style="font-weight:800;font-size:0.82rem;color:${it.currency === 'diamonds' ? '#7c3aed' : '#d97706'};">${priceLabel}</span>
                  ${it.consumable ? `
                    <button type="button" class="pk9-btn-exam-primary pk9-shop-act-btn" data-rpg-buy="${esc(it.id)}">🛒 Mua & Dùng</button>
                  ` : equipped ? `
                    ${it.category === 'pet'
                      ? `<button type="button" class="pk9-btn-exam-ghost pk9-shop-act-btn" data-rpg-unequip="pet">✓ Đang mặc (Tháo)</button>`
                      : `<span class="pk9-badge pk9-badge-verified">✓ Đang trang bị</span>`}
                  ` : owned ? `
                    <button type="button" class="pk9-btn-exam-primary pk9-shop-act-btn" data-rpg-equip="${esc(it.id)}">⚡ Trang bị</button>
                  ` : `
                    <button type="button" class="pk9-btn-exam-primary pk9-shop-act-btn" data-rpg-buy="${esc(it.id)}">🛒 Mua ngay</button>
                  `}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ========================================================================
  // TAB C: BẢNG TUẦN HOÀN 118 NGUYÊN TỐ (TRA CỨU + MỞ Ô SƯU TẦM)
  // ========================================================================
  function renderPeriodicTab() {
    const root = document.getElementById('tab-periodic');
    if (!root) return;
    const rpg = getRpgState();
    const unlockedSet = new Set(rpg.periodic?.unlocked || [1, 6, 8]);
    const tickets = Number(rpg.periodic?.tickets || 0);
    const sel = ELEMENT_BY_Z.get(RPG_UI.ptSelectedZ) || ELEMENT_BY_Z.get(6);
    const selUnlocked = RPG_UI.ptMode === 'lookup' || unlockedSet.has(sel.z);
    const q = RPG_UI.ptSearch.trim().toLowerCase();

    const cellsHtml = ELEMENTS.map(el => {
      const open = RPG_UI.ptMode === 'lookup' || unlockedSet.has(el.z);
      const match = !q || `${el.z} ${el.sym} ${el.name}`.toLowerCase().includes(q);
      const active = el.z === sel.z;
      return `
        <button type="button"
          class="pk9-pt-cell cat-${esc(el.cat)} ${open ? 'open' : 'locked'} ${active ? 'selected' : ''} ${match ? '' : 'dimmed'}"
          style="grid-row:${el.row};grid-column:${el.col};"
          data-pt-pick="${el.z}"
          title="${open ? `${el.z} ${el.sym} - ${el.name}` : `Ô #${el.z} chưa mở`}">
          <span class="pk9-pt-z">${el.z}</span>
          <strong class="pk9-pt-sym">${open ? esc(el.sym) : '?'}</strong>
          <span class="pk9-pt-name">${open ? esc(el.name.split(' ')[0]) : 'Khóa'}</span>
        </button>
      `;
    }).join('');

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <h2 style="margin:0 0 0.45rem;font-size:1.5rem;font-weight:900;">⚗️ Bảng Tuần Hoàn 118 Nguyên Tố Hóa Học (IUPAC)</h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.9rem;">
                Đã mở khóa <b>${unlockedSet.size} / 118</b> nguyên tố • 🎫 Vé chọn đích danh: <b>${tickets}</b> (Mở thêm <b>${rpg.periodic?.next_ticket_in || 10}</b> ô được tặng +1 Vé chọn & +1 💎). Bấm sang <b>Tra cứu 118 ô</b> bất cứ lúc nào khi ôn bài!
              </p>
            </div>
            <div class="pk9-pt-hero-actions">
              ${renderCurrencyStrip(rpg)}
              <div class="pk9-pt-hero-btns">
                <button type="button" class="pk9-btn-hero-main" data-pt-gacha="random" style="padding:0.5rem 0.9rem;font-size:0.82rem;">🎲 Mở Ngẫu Nhiên (120 🪙)</button>
                ${tickets > 0 && RPG_UI.ptMode === 'gacha' && !unlockedSet.has(sel.z) ? `
                  <button type="button" class="pk9-btn-hero-sec" data-pt-gacha="ticket" data-pt-z="${sel.z}" style="padding:0.5rem 0.9rem;font-size:0.82rem;">🎫 Dùng Vé Mở Ô #${sel.z}</button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            <button type="button" class="pk9-exam-chip ${RPG_UI.ptMode === 'lookup' ? 'active' : ''}" data-pt-mode="lookup">🔍 Tra Cứu Full 118 Nguyên Tố</button>
            <button type="button" class="pk9-exam-chip ${RPG_UI.ptMode === 'gacha' ? 'active' : ''}" data-pt-mode="gacha">🎁 Sưu Tầm Mở Ô (${unlockedSet.size}/118)</button>
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-pt-search-input" placeholder="Tìm Z, kí hiệu (Fe, Au), tên Việt..." value="${esc(RPG_UI.ptSearch)}" />
          </div>
        </div>

        <div class="pk9-card pk9-pt-detail">
          <div class="pk9-pt-detail-badge cat-${esc(sel.cat)}">
            <span>Z = ${sel.z}</span>
            <strong>${selUnlocked ? esc(sel.sym) : '?'}</strong>
          </div>
          <div style="min-width:0;flex:1;">
            <div style="font-weight:900;font-size:1.05rem;">${selUnlocked ? esc(sel.name) : `Ô nguyên tố #${sel.z} đang bị khóa`}</div>
            ${selUnlocked ? `
              <div style="font-size:0.82rem;color:var(--pk9-text-muted);margin:0.25rem 0;">
                Phân loại: <b>${esc(CAT_LABELS[sel.cat] || sel.cat)}</b> • NTK: <b>${sel.mass}</b> • Chu kì <b>${sel.period}</b> • Cấu hình e: <code>${esc(sel.config)}</code> • Số oxh/Hóa trị: <b>${esc(sel.val)}</b>
              </div>
              <div style="font-size:0.83rem;color:var(--pk9-primary);font-weight:600;">💡 Mẹo thi THPT: ${esc(sel.tip)}</div>
            ` : `
              <div style="font-size:0.82rem;color:var(--pk9-text-muted);margin:0.25rem 0;">
                ${tickets > 0 ? 'Bấm nút "Dùng Vé Mở Ô" bên dưới hoặc chuyển sang Tra cứu Full 118 để xem công thức ngay!' : 'Chuyển sang tab "Tra Cứu Full 118" hoặc bấm "Mở Ngẫu Nhiên (120 Vàng)" để sưu tầm.'}
              </div>
              ${tickets > 0 ? `<button type="button" class="pk9-btn-exam-primary" data-pt-gacha="ticket" data-pt-z="${sel.z}" style="margin-top:0.4rem;padding:0.4rem 0.85rem;font-size:0.8rem;">🎫 Dùng 1 Vé chọn mở ngay Z=${sel.z}</button>` : ''}
            `}
          </div>
        </div>

        <div class="pk9-pt-mob-hint">👆 Vuốt ngang để xem đủ 18 nhóm • Chạm ô xem cấu hình e & mẹo thi</div>
        <div class="pk9-pt-scroll">
          <div class="pk9-pt-grid">${cellsHtml}</div>
        </div>
      </div>
    `;
  }

  // ========================================================================
  // TAB D: GAME HÀNH TRÌNH VƯỢT ĐẢO & CỜ VÙNG TUẦN
  // ========================================================================
  function renderJourneyTab() {
    const root = document.getElementById('tab-journey');
    if (!root) return;
    if (RPG_UI.quizSession && RPG_UI.quizSession.mode === 'journey') {
      root.innerHTML = renderQuizRunnerHtml(RPG_UI.quizSession);
      typeset(root);
      return;
    }

    const rpg = getRpgState();
    const user = window.PK9_GET_USER ? window.PK9_GET_USER() : null;
    const isGuestLocked = !user || Boolean(RPG_UI.journeyData?.locked);
    const jProg = rpg.journey || {};
    const leaders = isGuestLocked ? [] : (RPG_UI.journeyData?.leaders || []);

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <h2 style="margin:0 0 0.45rem;font-size:1.5rem;font-weight:900;">🗺️ Game Hành Trình Vượt Đảo Tri Thức & Cờ Vùng Tuần 🚩</h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.9rem;">
                Chạm vào từng Đảo để thi tốc độ 5 câu. Đạt 3⭐ lần đầu tặng +1 Kim cương! Điểm lượt cao nhất tuần sẽ giữ <b>Cờ Vùng Tuần 🚩</b> cho khối của bạn.
              </p>
            </div>
            <div>${renderCurrencyStrip(rpg)}</div>
          </div>
        </div>

        <div class="pk9-journey-layout">
          <div class="pk9-shop-grid">
            ${ISLANDS.map(isl => {
              const st = jProg[isl.id] || { stars: 0, best_score: 0, plays: 0 };
              const starsStr = '⭐'.repeat(st.stars || 0) + '☆'.repeat(3 - (st.stars || 0));
              return `
                <article class="pk9-shop-card">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:1.9rem;">${isl.icon}</span>
                    <span style="font-size:0.9rem;letter-spacing:2px;">${starsStr}</span>
                  </div>
                  <div style="font-weight:900;font-size:0.96rem;margin-top:0.45rem;">${esc(isl.name)}</div>
                  <div style="font-size:0.78rem;color:var(--pk9-text-muted);flex:1;margin:0.25rem 0 0.65rem;">${esc(isl.desc)}</div>
                  <div style="font-size:0.75rem;color:var(--pk9-text-muted);margin-bottom:0.55rem;">
                    Kỉ lục: <b>${st.best_score || 0}</b> đ • Lượt chơi: ${st.plays || 0}
                  </div>
                  ${user ? `
                    <button type="button" class="pk9-btn-exam-primary" data-start-island="${esc(isl.id)}" data-island-subj="${esc(isl.subject)}" style="width:100%;padding:0.48rem;">
                      ⛵ Vượt Đảo Ngay (5 câu)
                    </button>
                  ` : `
                    <button type="button" class="pk9-btn-exam-ghost" data-open-auth="register" style="width:100%;padding:0.48rem;">
                      🔒 Đăng ký để Vượt Đảo & Tranh Cờ
                    </button>
                  `}
                </article>
              `;
            }).join('')}
          </div>

          <aside class="pk9-card">
            <h4 style="margin:0 0 0.65rem;font-size:1rem;font-weight:900;">🚩 Cờ Vùng Tuần (${esc(RPG_UI.journeyData?.week_key || 'Tuần này')} • Khối ${esc(RPG_UI.journeyData?.grade || '2K9')})</h4>
            ${isGuestLocked ? `
              <div style="padding:1.15rem 0.9rem;border-radius:0.85rem;background:var(--pk9-surface-2);border:1px dashed var(--pk9-border);text-align:center;">
                <div style="font-size:1.6rem;margin-bottom:0.35rem;">🔒</div>
                <div style="font-weight:900;font-size:0.92rem;margin-bottom:0.35rem;">BXH Cờ Vùng Tuần Đang Khóa</div>
                <p style="margin:0 0 0.8rem;font-size:0.8rem;color:var(--pk9-text-muted);line-height:1.5;">
                  Tài khoản Khách không thể đua Cờ Vùng Tuần. Hãy đăng ký hoặc đăng nhập để mở khóa BXH và tranh Cờ #1!
                </p>
                <div style="display:flex;gap:0.45rem;justify-content:center;flex-wrap:wrap;">
                  <button type="button" class="pk9-btn-exam-primary" data-open-auth="register" style="padding:0.42rem 0.78rem;font-size:0.78rem;">✨ Đăng ký ngay</button>
                  <button type="button" class="pk9-btn-exam-ghost" data-open-auth="login" style="padding:0.42rem 0.78rem;font-size:0.78rem;">🔑 Đăng nhập</button>
                </div>
              </div>
            ` : leaders.length ? leaders.map(row => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.5rem 0.65rem;border-radius:0.75rem;background:${row.has_flag ? 'rgba(245,158,11,0.12)' : 'var(--pk9-surface-2)'};border:1px solid var(--pk9-border);margin-bottom:0.45rem;font-size:0.82rem;">
                <div style="display:flex;align-items:center;gap:0.45rem;min-width:0;">
                  <b>${row.has_flag ? '🚩 #1' : `#${row.rank}`}</b>
                  <span>${esc(row.outfit_icon || '🧑‍🎓')}</span>
                  <span style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(row.display_name)}</span>
                </div>
                <span class="pk9-badge pk9-badge-subj">${row.best_score} đ</span>
              </div>
            `).join('') : `
              <div style="font-size:0.82rem;color:var(--pk9-text-muted);padding:1rem;text-align:center;">
                Chưa có ai giữ Cờ tuần này — hãy chơi 1 Đảo để giật Cờ #1 đầu tiên!
              </div>
            `}
          </aside>
        </div>
      </div>
    `;
  }

  // ========================================================================
  // TAB E: NHÂN VẬT, THẺ HỌC VIÊN QR & TẢI ẢNH PNG
  // ========================================================================
  function renderIdCardTab() {
    const root = document.getElementById('tab-idcard');
    if (!root) return;
    const rpg = getRpgState();
    const user = window.PK9_GET_USER ? window.PK9_GET_USER() : null;
    const eq = rpg.equipped_details || {};
    const tier = rpg.tier || { name: 'Bậc Đồng', icon: '🥉', nextTier: null };
    const displayName = user?.display_name || 'Học Viên Phúc K9';
    const username = user?.username || 'khach_k9';
    const grade = user?.settings?.preferred_grade || '2K9';
    const school = user?.settings?.school || 'Hệ Sinh Thái Học Cùng Phúc K9';
    const sbd = rpg.sbd || 'K9-STUDENT';
    const qrPayload = `PHUCK9:${username}:${sbd}:${grade}`;

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-idcard-layout">
          <div class="pk9-card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.85rem;">
              <h3 style="margin:0;font-size:1.12rem;font-weight:900;">🧑‍🎓 Nhân Vật & Chỉ Số Học Viên</h3>
              <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="shop" style="padding:0.35rem 0.7rem;font-size:0.78rem;">🛍️ Thay đồ</button>
            </div>
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
              <div class="pk9-rpg-avatar-box lg ${esc(eq.frame?.cssClass || 'pk9-frame-bronze')}">
                <span class="pk9-rpg-outfit">${eq.outfit?.icon || '🧑‍🎓'}</span>
                ${eq.pet?.icon ? `<span class="pk9-rpg-pet-badge">${eq.pet.icon}</span>` : ''}
              </div>
              <div style="min-width:0;flex:1;">
                <div style="font-size:1.15rem;font-weight:900;">${esc(displayName)}</div>
                <div style="font-size:0.82rem;color:var(--pk9-text-muted);margin:0.15rem 0 0.45rem;">
                  ${tier.icon} <b>${esc(tier.name)}</b> ${eq.title ? `• ${eq.title.icon} ${esc(eq.title.name)}` : ''}
                </div>
                ${tier.nextTier ? `<div style="font-size:0.78rem;color:var(--pk9-primary);margin-bottom:0.45rem;">Còn <b>${tier.nextTier.remainingXp} EXP</b> → ${esc(tier.nextTier.name)}</div>` : ''}
                ${renderCurrencyStrip(rpg)}
              </div>
            </div>

            <form id="pk9-motto-form" class="pk9-motto-form">
              <input type="text" name="motto" class="pk9-input" maxlength="90" style="flex:1;margin-top:0;" placeholder="Nhập khẩu hiệu mục tiêu của bạn..." value="${esc(rpg.motto || '')}" />
              <button type="submit" class="pk9-btn-exam-primary" style="padding:0.5rem 0.9rem;">💾 Lưu khẩu hiệu</button>
            </form>

            <div class="pk9-idcard-actions">
              <button type="button" class="pk9-btn-exam-primary" data-rpg-checkin="1">
                ${rpg.checkin?.checked_today ? `✅ Đã Điểm Danh (${rpg.checkin?.total_days || 1} ngày)` : '🎁 Điểm Danh Quà 24h'}
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-download-idcard="1">
                ⬇️ Tải Ảnh Thẻ Học Viên (.PNG)
              </button>
            </div>
          </div>

          <!-- STUDENT QR ID CARD -->
          <div class="pk9-student-idcard ${esc(eq.cardbg?.cssClass || 'pk9-cardbg-ocean')}" id="pk9-idcard-preview">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
              <div style="min-width:0;">
                <div style="font-size:0.7rem;font-weight:800;letter-spacing:0.06em;opacity:0.9;">THẺ HỌC VIÊN ĐIỆN TỬ • PHÚC K9</div>
                <div class="pk9-idcard-name">${esc(displayName)}</div>
              </div>
              <span style="font-size:1.75rem;flex-shrink:0;">${eq.outfit?.icon || '🧑‍🎓'}</span>
            </div>
            <div class="pk9-idcard-body">
              <button type="button" class="pk9-qr-wrap pk9-qr-zoom-trigger" data-zoom-qr="1" data-qr-code="${esc(qrPayload)}" data-qr-name="${esc(displayName)}" data-qr-sbd="${esc(sbd)}" title="Chạm để phóng to mã QR">
                ${buildQrSvg(qrPayload, 118)}
                <span class="pk9-qr-zoom-hint">🔍 Phóng to QR</span>
              </button>
              <div class="pk9-idcard-meta">
                <div>SBD: <b style="font-size:0.94rem;">${esc(sbd)}</b></div>
                <div>Khối: <b>${esc(grade)}</b> • <b>${esc(tier.name)}</b></div>
                <div>Trường: ${esc(school)}</div>
                <div>Tuần Hoàn: <b>${rpg.periodic?.unlocked_count || 3}/118</b> • Câu: <b>${rpg.questions_conquered || 0}</b></div>
                ${rpg.motto ? `<div style="margin-top:0.35rem;font-style:italic;opacity:0.92;">“${esc(rpg.motto)}”</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function downloadIdCardPng() {
    const rpg = getRpgState();
    const user = window.PK9_GET_USER ? window.PK9_GET_USER() : null;
    const eq = rpg.equipped_details || {};
    const displayName = user?.display_name || 'Học Viên Phúc K9';
    const sbd = rpg.sbd || 'K9-STUDENT';
    const grade = user?.settings?.preferred_grade || '2K9';
    const tier = rpg.tier?.name || 'Bậc Đồng';
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 900, 520);
    const bgId = eq.cardbg?.id || 'cardbg-ocean';
    if (bgId === 'cardbg-emerald') { grad.addColorStop(0, '#064e3b'); grad.addColorStop(1, '#059669'); }
    else if (bgId === 'cardbg-sunset') { grad.addColorStop(0, '#9a3412'); grad.addColorStop(1, '#db2777'); }
    else if (bgId === 'cardbg-cyber') { grad.addColorStop(0, '#312e81'); grad.addColorStop(1, '#7c3aed'); }
    else { grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#2563eb'); }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 520);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(32, 32, 836, 456);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Be Vietnam Pro", sans-serif';
    ctx.fillText('HỆ SINH THÁI HỌC CÙNG PHÚC K9 • THẺ HỌC VIÊN', 62, 86);
    ctx.font = 'bold 42px "Be Vietnam Pro", sans-serif';
    ctx.fillText(displayName, 62, 152);
    ctx.font = '24px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`SBD: ${sbd}  |  Khối: ${grade}  |  ${tier}`, 62, 206);
    ctx.fillText(`Vàng: ${rpg.gold}  |  Kim cương: ${rpg.diamonds}  |  Bảng tuần hoàn: ${rpg.periodic?.unlocked_count || 3}/118`, 62, 252);
    if (rpg.motto) ctx.fillText(`“${rpg.motto}”`, 62, 310);

    // Draw deterministic QR grid on right
    const qrSvgStr = buildQrSvg(`PHUCK9:${user?.username || 'guest'}:${sbd}:${grade}`, 220);
    const blob = new Blob([qrSvgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 610, 145, 220, 220);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `the-hoc-vien-${sbd}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast('Đã tải ảnh Thẻ Học Viên QR (.png) thành công!', 'success');
    };
    img.src = url;
  }

  function startQuizSession(mode, opts = {}) {
    const rpg = getRpgState();
    const pool = buildQuestionPool();
    let chosen = [];

    if (mode === 'srs') {
      const nowMs = Date.now();
      const srsIds = new Set(
        (rpg.srs?.items || [])
          .filter(x => Number(x.dueAt || 0) <= nowMs)
          .map(x => String(x.id))
      );
      chosen = pool.filter(q => srsIds.has(String(q.id)));
      if (!chosen.length) {
        const anySrsIds = new Set((rpg.srs?.items || []).map(x => String(x.id)));
        chosen = pool.filter(q => anySrsIds.has(String(q.id)));
      }
      if (!chosen.length) chosen = pool.slice(0, 5);
    } else if (mode === 'journey') {
      const subj = opts.subject || 'Tất cả';
      const filtered = subj === 'Tất cả' ? pool : pool.filter(q => q.subject === subj);
      chosen = filtered.sort(() => Math.random() - 0.5).slice(0, 5);
    } else {
      const filtered = pool.filter(q =>
        (RPG_UI.practiceSubj === 'Tất cả' || q.subject === RPG_UI.practiceSubj) &&
        (RPG_UI.practiceDiff === 'Tất cả' || q.diff === RPG_UI.practiceDiff)
      );
      chosen = filtered.sort(() => Math.random() - 0.5).slice(0, RPG_UI.practiceCount);
    }

    if (!chosen.length) {
      toast('Không đủ câu hỏi phù hợp bộ lọc, hãy chọn "Tất cả" nhé!', 'warning');
      return;
    }

    RPG_UI.quizSession = {
      mode,
      islandId: opts.islandId || '',
      questions: chosen,
      idx: 0,
      picked: '',
      results: [],
      startTs: Date.now(),
      finished: false
    };
    renderActiveRpgTab();
  }

  function renderActiveRpgTab() {
    if (document.getElementById('tab-missions')?.classList.contains('active')) renderMissionsTab();
    if (document.getElementById('tab-shop')?.classList.contains('active')) renderShopTab();
    if (document.getElementById('tab-periodic')?.classList.contains('active')) renderPeriodicTab();
    if (document.getElementById('tab-journey')?.classList.contains('active')) renderJourneyTab();
    if (document.getElementById('tab-idcard')?.classList.contains('active')) renderIdCardTab();
  }

  function bindEvents() {
    document.addEventListener('click', async e => {
      if (e.target.closest('[data-rpg-checkin]')) {
        await rpgPost('rpg-checkin', {});
        return;
      }
      const claimBtn = e.target.closest('[data-rpg-claim]');
      if (claimBtn) {
        await rpgPost('rpg-claim-mission', { mission_id: claimBtn.getAttribute('data-rpg-claim') });
        return;
      }
      const mtab = e.target.closest('[data-rpg-mtab]');
      if (mtab) {
        RPG_UI.missionTab = mtab.getAttribute('data-rpg-mtab');
        renderMissionsTab();
        return;
      }
      const prSubj = e.target.closest('[data-pr-subj]');
      if (prSubj) { RPG_UI.practiceSubj = prSubj.getAttribute('data-pr-subj'); renderMissionsTab(); return; }
      const prDiff = e.target.closest('[data-pr-diff]');
      if (prDiff) { RPG_UI.practiceDiff = prDiff.getAttribute('data-pr-diff'); renderMissionsTab(); return; }
      const prCount = e.target.closest('[data-pr-count]');
      if (prCount) { RPG_UI.practiceCount = Number(prCount.getAttribute('data-pr-count')) || 5; renderMissionsTab(); return; }

      const startPr = e.target.closest('[data-start-practice]');
      if (startPr) {
        startQuizSession(startPr.getAttribute('data-start-practice'));
        return;
      }
      const startIsl = e.target.closest('[data-start-island]');
      if (startIsl) {
        if (!window.PK9_GET_USER || !window.PK9_GET_USER()) {
          toast('🔒 Tài khoản Khách không thể đua Vượt Đảo. Hãy đăng ký hoặc đăng nhập để mở khóa!', 'warning');
          if (typeof window.PK9_OPEN_AUTH === 'function') window.PK9_OPEN_AUTH('register');
          return;
        }
        startQuizSession('journey', {
          islandId: startIsl.getAttribute('data-start-island'),
          subject: startIsl.getAttribute('data-island-subj')
        });
        return;
      }
      if (e.target.closest('[data-close-quiz-sess]')) {
        RPG_UI.quizSession = null;
        renderActiveRpgTab();
        return;
      }
      const pickBtn = e.target.closest('[data-rpg-pick]');
      if (pickBtn && RPG_UI.quizSession && !RPG_UI.quizSession.picked) {
        const sess = RPG_UI.quizSession;
        const q = sess.questions[sess.idx];
        const picked = pickBtn.getAttribute('data-rpg-pick');
        sess.picked = picked;
        sess.results.push({
          id: q.id,
          correct: picked.toUpperCase() === String(q.answer || 'A').toUpperCase(),
          topic: q.topic || '',
          subject: q.subject || ''
        });
        renderActiveRpgTab();
        return;
      }
      if (e.target.closest('[data-rpg-next-q]') && RPG_UI.quizSession) {
        const sess = RPG_UI.quizSession;
        if (sess.idx + 1 < sess.questions.length) {
          sess.idx += 1;
          sess.picked = '';
          renderActiveRpgTab();
          return;
        }
        sess.finished = true;
        renderActiveRpgTab();
        const okCount = sess.results.filter(r => r.correct).length;
        if (sess.mode === 'journey') {
          const sec = Math.max(1, Math.round((Date.now() - sess.startTs) / 1000));
          await rpgPost('rpg-journey-submit', { island_id: sess.islandId, correct: okCount, total: sess.questions.length, time_sec: sec });
        } else {
          await rpgPost('rpg-practice-finish', { mode: sess.mode, results: sess.results });
        }
        return;
      }

      const shopTab = e.target.closest('[data-shop-tab]');
      if (shopTab) { RPG_UI.shopTab = shopTab.getAttribute('data-shop-tab'); renderShopTab(); return; }
      const shopCat = e.target.closest('[data-shop-cat]');
      if (shopCat) { RPG_UI.shopCat = shopCat.getAttribute('data-shop-cat'); renderShopTab(); return; }

      const buyBtn = e.target.closest('[data-rpg-buy]');
      if (buyBtn) { await rpgPost('rpg-buy', { item_id: buyBtn.getAttribute('data-rpg-buy') }); return; }
      const equipBtn = e.target.closest('[data-rpg-equip]');
      if (equipBtn) { await rpgPost('rpg-equip', { item_id: equipBtn.getAttribute('data-rpg-equip') }); return; }
      const unequipBtn = e.target.closest('[data-rpg-unequip]');
      if (unequipBtn) { await rpgPost('rpg-equip', { unequip: unequipBtn.getAttribute('data-rpg-unequip') }); return; }
      const convBtn = e.target.closest('[data-rpg-convert]');
      if (convBtn) { await rpgPost('rpg-convert', { direction: convBtn.getAttribute('data-rpg-convert'), amount: 1 }); return; }

      const ptMode = e.target.closest('[data-pt-mode]');
      if (ptMode) { RPG_UI.ptMode = ptMode.getAttribute('data-pt-mode'); renderPeriodicTab(); return; }
      const ptPick = e.target.closest('[data-pt-pick]');
      if (ptPick) { RPG_UI.ptSelectedZ = Number(ptPick.getAttribute('data-pt-pick')) || 6; renderPeriodicTab(); return; }
      const ptGacha = e.target.closest('[data-pt-gacha]');
      if (ptGacha) {
        const mode = ptGacha.getAttribute('data-pt-gacha');
        const z = Number(ptGacha.getAttribute('data-pt-z') || RPG_UI.ptSelectedZ || 0);
        const res = await rpgPost('rpg-periodic-open', { mode, z });
        if (res.ok && res.data?.z) RPG_UI.ptSelectedZ = res.data.z;
        renderPeriodicTab();
        return;
      }

      const qrTrigger = e.target.closest('[data-zoom-qr]');
      if (qrTrigger) {
        const old = document.getElementById('pk9-qr-zoom-modal');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.id = 'pk9-qr-zoom-modal';
        modal.className = 'pk9-qr-zoom-modal';
        modal.innerHTML = `
          <div class="pk9-qr-zoom-card">
            <div style="font-weight:900;font-size:1rem;margin-bottom:0.2rem;color:#0f172a;">${esc(qrTrigger.getAttribute('data-qr-name') || 'Thẻ Học Viên')}</div>
            <div style="font-size:0.8rem;color:#475569;margin-bottom:0.75rem;">SBD: <b>${esc(qrTrigger.getAttribute('data-qr-sbd') || 'K9')}</b></div>
            ${buildQrSvg(qrTrigger.getAttribute('data-qr-code') || 'PHUCK9', 230)}
            <button type="button" class="pk9-btn-exam-primary" data-close-qr-zoom="1" style="margin-top:0.85rem;width:100%;">✕ Đóng</button>
          </div>
        `;
        document.body.appendChild(modal);
        return;
      }
      if (e.target.closest('[data-close-qr-zoom]') || (e.target && e.target.id === 'pk9-qr-zoom-modal')) {
        const modal = document.getElementById('pk9-qr-zoom-modal');
        if (modal) modal.remove();
        return;
      }

      if (e.target.closest('[data-download-idcard]')) {
        downloadIdCardPng();
      }
    });

    document.addEventListener('input', e => {
      if (e.target && e.target.id === 'pk9-pt-search-input') {
        RPG_UI.ptSearch = e.target.value || '';
        renderPeriodicTab();
        const inp = document.getElementById('pk9-pt-search-input');
        if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
      }
    });

    document.addEventListener('submit', async e => {
      if (e.target && e.target.id === 'pk9-motto-form') {
        e.preventDefault();
        const motto = e.target.motto?.value || '';
        await rpgPost('rpg-settings', { motto });
      }
    });
  }

  window.PK9_RPG = {
    ELEMENTS,
    ELEMENTS_COUNT: ELEMENTS.length,
    getState: getRpgState,
    loadMeta: loadRpgMeta,
    rpgPost,
    renderHomeWidget: renderHomeRpgWidget,
    renderTab(tabId) {
      if (tabId === 'missions') renderMissionsTab();
      else if (tabId === 'shop') {
        if (!RPG_UI.catalog.length) loadRpgMeta().then(() => renderShopTab());
        renderShopTab();
      } else if (tabId === 'periodic') renderPeriodicTab();
      else if (tabId === 'journey') {
        loadRpgMeta().then(() => renderJourneyTab());
        renderJourneyTab();
      } else if (tabId === 'idcard') renderIdCardTab();
    }
  };

  bindEvents();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadRpgMeta());
  } else {
    loadRpgMeta();
  }
})(window, document);
