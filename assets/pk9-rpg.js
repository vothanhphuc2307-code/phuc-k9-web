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

  // Curated 285-question drill bank + 60 IUPAC Periodic Table drills + Curriculum & Exam bridges (600+ total questions)
  const RAW_DRILLS = [
  // ==================== TOÁN HỌC (50 CÂU) ====================
  ['dr-toan-1', 'Toán', 'Hàm số & Cực trị', 'Dễ', 'Cho hàm số $y = x^3 - 3x + 2$. Số điểm cực trị của hàm số là bao nhiêu?', ['2', '0', '1', '3'], 'A', "$y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$, đạo hàm đổi dấu 2 lần nên hàm số có 2 điểm cực trị."],
  ['dr-toan-2', 'Toán', 'Nguyên hàm - Tích phân', 'TB', 'Tính tích phân $I = \\int_0^1 e^{2x}\\,dx$.', ['$\\frac{e^2 - 1}{2}$', '$e^2 - 1$', '$\\frac{e^2}{2}$', '$2(e^2 - 1)$'], 'A', '$\\int_0^1 e^{2x}dx = \\left.\\frac{1}{2}e^{2x}\\right|_0^1 = \\frac{e^2 - 1}{2}$.'],
  ['dr-toan-3', 'Toán', 'Oxyz & Khoảng cách', 'Khó', 'Trong không gian $Oxyz$, khoảng cách từ điểm $M(1;-2;3)$ đến mặt phẳng $(P): 2x - 2y + z - 5 = 0$ bằng:', ['4/3', '2', '3', '1'], 'A', '$d(M,(P)) = \\frac{|2(1) - 2(-2) + 3 - 5|}{\\sqrt{4+4+1}} = \\frac{4}{3}$.'],
  ['dr-toan-4', 'Toán', 'Xác suất có điều kiện', 'Siêu khó', 'Tung 2 con xúc xắc cân đối. Biết tổng số chấm lớn hơn 8, xác suất để xuất hiện ít nhất một mặt 6 chấm là:', ['7/10', '3/5', '4/5', '1/2'], 'A', 'Tổng > 8 gồm 10 cặp kết quả ((3,6),(4,5),(4,6),(5,4),(5,5),(5,6),(6,3),(6,4),(6,5),(6,6)), trong đó có 7 cặp chứa mặt 6 → xác suất = 7/10.'],
  ['dr-toan-5', 'Toán', 'Tính đơn điệu hàm số', 'Dễ', 'Hàm số $y = -x^3 + 3x^2 - 1$ đồng biến trên khoảng nào dưới đây?', ['$(0; 2)$', '$(-\\infty; 0)$', '$(2; +\\infty)$', '$(-2; 0)$'], 'A', "$y' = -3x^2 + 6x > 0 \\Leftrightarrow 0 < x < 2$."],
  ['dr-toan-6', 'Toán', 'Tính đơn điệu hàm số', 'TB', 'Hàm số $y = \\frac{x-2}{x+1}$ có tính chất nào sau đây?', ['Đồng biến trên từng khoảng $(-\\infty; -1)$ và $(-1; +\\infty)$', 'Đồng biến trên $\\mathbb{R}$', 'Nghịch biến trên từng khoảng xác định', 'Có 1 điểm cực đại'], 'A', "$y' = \\frac{1 - (-2)}{(x+1)^2} = \\frac{3}{(x+1)^2} > 0, \\forall x \\neq -1$."],
  ['dr-toan-7', 'Toán', 'Cực trị hàm trùng phương', 'Dễ', 'Cho hàm số $y = x^4 - 2x^2 + 5$. Điểm cực đại của hàm số là:', ['$x = 0$', '$x = 1$', '$x = -1$', '$y = 5$'], 'A', "$y' = 4x^3 - 4x = 0 \\Leftrightarrow x \\in \\{0, \\pm 1\\}$. Đạo hàm đổi dấu từ $+$ sang $-$ qua $x = 0$."],
  ['dr-toan-8', 'Toán', 'GTLN - GTNN của hàm số', 'TB', 'Giá trị lớn nhất của hàm số $f(x) = x^3 - 3x^2 - 9x + 10$ trên đoạn $[-2; 2]$ bằng:', ['$15$', '$-12$', '$10$', '$2$'], 'A', "$f'(x) = 3x^2 - 6x - 9 = 0 \\Leftrightarrow x = -1 \\in [-2;2]$ (hoặc $x=3 \\notin [-2;2]$). Tính $f(-2)=8, f(-1)=15, f(2)=-12 \\Rightarrow \\max = 15$."],
  ['dr-toan-9', 'Toán', 'GTLN - GTNN thực tế', 'Khó', 'Cho hai số dương $x, y$ thỏa mãn $x + y = 6$. Giá trị nhỏ nhất của biểu thức $P = x^2 + y^2$ bằng:', ['$18$', '$36$', '$12$', '$24$'], 'A', '$P = x^2 + y^2 \\ge \\frac{(x+y)^2}{2} = \\frac{36}{2} = 18$, dấu bằng xảy ra khi $x = y = 3$.'],
  ['dr-toan-10', 'Toán', 'Đường tiệm cận', 'Dễ', 'Đồ thị hàm số $y = \\frac{3x - 1}{x + 2}$ có tiệm cận ngang là đường thẳng:', ['$y = 3$', '$x = -2$', '$y = -2$', '$x = 3$'], 'A', '$\\lim_{x \\to \\pm\\infty} \\frac{3x-1}{x+2} = 3 \\Rightarrow$ TCN là $y = 3$.'],
  ['dr-toan-11', 'Toán', 'Tiệm cận xiên GDPT 2018', 'TB', 'Đồ thị hàm số $y = \\frac{2x^2 - 3x + 5}{x - 1}$ có đường tiệm cận xiên là:', ['$y = 2x - 1$', '$y = 2x + 1$', '$y = 2x - 3$', '$y = x - 1$'], 'A', 'Chia đa thức: $y = 2x - 1 + \\frac{4}{x-1} \\Rightarrow$ tiệm cận xiên là $y = 2x - 1$.'],
  ['dr-toan-12', 'Toán', 'Số đường tiệm cận', 'Khó', 'Tổng số đường tiệm cận đứng và tiệm cận ngang của đồ thị hàm số $y = \\frac{x - 1}{x^2 - 3x + 2}$ là:', ['$2$', '$3$', '$1$', '$0$'], 'A', '$y = \\frac{x-1}{(x-1)(x-2)} = \\frac{1}{x-2}$ (với $x \\neq 1$). Chỉ có 1 TCĐ $x = 2$ và 1 TCN $y = 0 \\Rightarrow$ tổng là 2.'],
  ['dr-toan-13', 'Toán', 'Tương giao đồ thị', 'TB', 'Số giao điểm của đồ thị hàm số $y = x^3 - 3x + 1$ và đường thẳng $y = 1$ là:', ['$3$', '$1$', '$2$', '$0$'], 'A', '$x^3 - 3x + 1 = 1 \\Leftrightarrow x(x^2 - 3) = 0 \\Leftrightarrow x \\in \\{0, \\pm\\sqrt{3}\\}$ (3 nghiệm phân biệt).'],
  ['dr-toan-14', 'Toán', 'Mũ & Logarit', 'Dễ', 'Với $a > 0, a \\neq 1$, giá trị của $\\log_a(a^5)$ bằng:', ['$5$', '$\\frac{1}{5}$', '$a$', '$1$'], 'A', 'Theo tính chất logarit cơ bản: $\\log_a(a^5) = 5$.'],
  ['dr-toan-15', 'Toán', 'Phương trình Logarit', 'TB', 'Nghiệm của phương trình $\\log_2(x - 1) = 3$ là:', ['$x = 9$', '$x = 7$', '$x = 10$', '$x = 8$'], 'A', '$x - 1 = 2^3 = 8 \\Leftrightarrow x = 9$ (thỏa ĐKXĐ $x > 1$).'],
  ['dr-toan-16', 'Toán', 'Bất phương trình Mũ', 'TB', 'Tập nghiệm của bất phương trình $\\left(\\frac{1}{3}\\right)^{x - 2} > \\frac{1}{9}$ là:', ['$(-\\infty; 4)$', '$(4; +\\infty)$', '$(2; 4)$', '$(-\\infty; 2)$'], 'A', 'Cơ số $1/3 \\in (0;1)$ nên đổi chiều: $x - 2 < 2 \\Leftrightarrow x < 4$.'],
  ['dr-toan-17', 'Toán', 'Cấp số cộng', 'Dễ', 'Cho cấp số cộng $(u_n)$ có $u_1 = 3$ và công sai $d = 4$. Số hạng $u_{10}$ bằng:', ['$39$', '$43$', '$36$', '$35$'], 'A', '$u_{10} = u_1 + 9d = 3 + 9 \\times 4 = 39$.'],
  ['dr-toan-18', 'Toán', 'Cấp số nhân', 'Dễ', 'Cho cấp số nhân $(u_n)$ có $u_1 = 2$ và công bội $q = 3$. Tổng 4 số hạng đầu tiên $S_4$ bằng:', ['$80$', '$54$', '$40$', '$162$'], 'A', '$S_4 = u_1 \\frac{q^4 - 1}{q - 1} = 2 \\cdot \\frac{81 - 1}{2} = 80$.'],
  ['dr-toan-19', 'Toán', 'Nguyên hàm cơ bản', 'Dễ', 'Họ nguyên hàm của hàm số $f(x) = \\cos x + 2x$ là:', ['$\\sin x + x^2 + C$', '$-\\sin x + x^2 + C$', '$\\sin x + 2 + C$', '$-\\cos x + x^2 + C$'], 'A', '$\\int (\\cos x + 2x)dx = \\sin x + x^2 + C$.'],
  ['dr-toan-20', 'Toán', 'Nguyên hàm hàm phân thức', 'TB', 'Tìm họ nguyên hàm $F(x) = \\int \\frac{1}{2x + 3}\\,dx$ trên $(-\\frac{3}{2}; +\\infty)$:', ['$\\frac{1}{2}\\ln|2x + 3| + C$', '$\\ln|2x + 3| + C$', '$2\\ln|2x + 3| + C$', '$-\\frac{1}{(2x+3)^2} + C$'], 'A', 'Áp dụng công thức $\\int \\frac{dx}{ax+b} = \\frac{1}{a}\\ln|ax+b| + C$.'],
  ['dr-toan-21', 'Toán', 'Tính chất Tích phân', 'Dễ', 'Biết $\\int_1^3 f(x)dx = 5$ và $\\int_1^3 g(x)dx = -2$. Giá trị của $\\int_1^3 [2f(x) - 3g(x)]dx$ bằng:', ['$16$', '$4$', '$12$', '$8$'], 'A', '$2(5) - 3(-2) = 10 + 6 = 16$.'],
  ['dr-toan-22', 'Toán', 'Tích phân từng phần', 'Khó', 'Tính tích phân $I = \\int_1^e x \\ln x\\,dx$.', ['$\\frac{e^2 + 1}{4}$', '$\\frac{e^2 - 1}{4}$', '$\\frac{e^2 + 1}{2}$', '$\\frac{e^2}{4}$'], 'A', 'Đặt $u = \\ln x, dv = x dx \\Rightarrow I = \\left.\\frac{x^2}{2}\\ln x\\right|_1^e - \\int_1^e \\frac{x}{2}dx = \\frac{e^2}{2} - \\frac{e^2 - 1}{4} = \\frac{e^2 + 1}{4}$.'],
  ['dr-toan-23', 'Toán', 'Diện tích hình phẳng', 'TB', 'Diện tích hình phẳng giới hạn bởi parabol $y = x^2$ và đường thẳng $y = 2x$ bằng:', ['$\\frac{4}{3}$', '$\\frac{2}{3}$', '$\\frac{8}{3}$', '$2$'], 'A', 'Hoành độ giao điểm $x^2 = 2x \\Leftrightarrow x = 0, x = 2$. $S = \\int_0^2 (2x - x^2)dx = \\left[x^2 - \\frac{x^3}{3}\\right]_0^2 = 4 - \\frac{8}{3} = \\frac{4}{3}$.'],
  ['dr-toan-24', 'Toán', 'Thể tích tròn xoay', 'TB', 'Cho hình phẳng giới hạn bởi $y = \\sqrt{x}$, trục $Ox$ và $x = 4$ quay quanh trục $Ox$. Thể tích khối tròn xoay tạo thành là:', ['$8\\pi$', '$8$', '$4\\pi$', '$16\\pi$'], 'A', '$V = \\pi \\int_0^4 (\\sqrt{x})^2 dx = \\pi \\left.\\frac{x^2}{2}\\right|_0^4 = 8\\pi$.'],
  ['dr-toan-25', 'Toán', 'Tích phân chuyển động', 'TB', 'Một ô tô đang chạy với vận tốc $20\\text{ m/s}$ thì người lái đạp phanh, chuyển động chậm dần đều với $v(t) = 20 - 4t\\text{ (m/s)}$. Quãng đường đi được từ lúc phanh đến khi dừng hẳn là:', ['$50\\text{ m}$', '$40\\text{ m}$', '$100\\text{ m}$', '$25\\text{ m}$'], 'A', 'Dừng hẳn khi $20 - 4t = 0 \\Leftrightarrow t = 5\\text{ s}$. $S = \\int_0^5 (20 - 4t)dt = [20t - 2t^2]_0^5 = 50\\text{ m}$.'],
  ['dr-toan-26', 'Toán', 'Vectơ trong không gian Oxyz', 'Dễ', 'Trong không gian $Oxyz$, cho $\\vec{u} = 2\\vec{i} - 3\\vec{j} + 6\\vec{k}$. Độ dài của vectơ $\\vec{u}$ bằng:', ['$7$', '$\\sqrt{11}$', '$5$', '$49$'], 'A', '$|\\vec{u}| = \\sqrt{2^2 + (-3)^2 + 6^2} = \\sqrt{49} = 7$.'],
  ['dr-toan-27', 'Toán', 'Góc giữa hai vectơ Oxyz', 'TB', 'Trong $Oxyz$, góc giữa hai vectơ $\\vec{a} = (1; 1; 0)$ và $\\vec{b} = (0; 1; 1)$ bằng:', ['$60^\\circ$', '$30^\\circ$', '$45^\\circ$', '$120^\\circ$'], 'A', '$\\cos(\\vec{a}, \\vec{b}) = \\frac{1\\cdot 0 + 1\\cdot 1 + 0\\cdot 1}{\\sqrt{2}\\cdot\\sqrt{2}} = \\frac{1}{2} \\Rightarrow 60^\\circ$.'],
  ['dr-toan-28', 'Toán', 'Trọng tâm tam giác Oxyz', 'Dễ', 'Trong $Oxyz$, cho $A(1; 2; -3), B(2; -1; 1), C(3; 5; 2)$. Tọa độ trọng tâm $G$ của tam giác $ABC$ là:', ['$(2; 2; 0)$', '$(6; 6; 0)$', '$(2; 1; 0)$', '$(3; 3; 0)$'], 'A', '$G = \\left(\\frac{1+2+3}{3}; \\frac{2-1+5}{3}; \\frac{-3+1+2}{3}\\right) = (2; 2; 0)$.'],
  ['dr-toan-29', 'Toán', 'Phương trình mặt phẳng', 'TB', 'Trong $Oxyz$, phương trình mặt phẳng đi qua $A(1; 0; -2)$ và có vectơ pháp tuyến $\\vec{n} = (1; -2; 3)$ là:', ['$x - 2y + 3z + 5 = 0$', '$x - 2y + 3z - 5 = 0$', '$x + 2y + 3z + 5 = 0$', '$x - 2y - 3z + 5 = 0$'], 'A', '$1(x - 1) - 2(y - 0) + 3(z + 2) = 0 \\Leftrightarrow x - 2y + 3z + 5 = 0$.'],
  ['dr-toan-30', 'Toán', 'Mặt phẳng đoạn chắn', 'Dễ', 'Mặt phẳng $(P)$ cắt 3 trục tọa độ tại $A(2;0;0), B(0;-3;0), C(0;0;4)$ có phương trình là:', ['$\\frac{x}{2} + \\frac{y}{-3} + \\frac{z}{4} = 1$', '$\\frac{x}{2} + \\frac{y}{-3} + \\frac{z}{4} = 0$', '$2x - 3y + 4z = 1$', '$\\frac{x}{2} + \\frac{y}{3} + \\frac{z}{4} = 1$'], 'A', 'Phương trình mặt phẳng theo đoạn chắn: $\\frac{x}{a} + \\frac{y}{b} + \\frac{z}{c} = 1$.'],
  ['dr-toan-31', 'Toán', 'Phương trình đường thẳng Oxyz', 'TB', 'Đường thẳng đi qua $M(2; -1; 3)$ và vuông góc với mặt phẳng $(P): x + 3y - 2z + 1 = 0$ có phương trình tham số là:', ['$x = 2 + t,\\; y = -1 + 3t,\\; z = 3 - 2t$', '$x = 1 + 2t,\\; y = 3 - t,\\; z = -2 + 3t$', '$x = 2 + t,\\; y = -1 - 3t,\\; z = 3 + 2t$', '$x = -2 + t,\\; y = 1 + 3t,\\; z = -3 - 2t$'], 'A', 'Đường thẳng vuông góc với $(P)$ nhận $\\vec{n}_P = (1; 3; -2)$ làm vectơ chỉ phương.'],
  ['dr-toan-32', 'Toán', 'Phương trình mặt cầu', 'TB', 'Trong $Oxyz$, mặt cầu $(S): x^2 + y^2 + z^2 - 2x + 4y - 6z - 2 = 0$ có tâm $I$ và bán kính $R$ là:', ['$I(1; -2; 3),\\; R = 4$', '$I(-1; 2; -3),\\; R = 4$', '$I(1; -2; 3),\\; R = 16$', '$I(2; -4; 6),\\; R = 4$'], 'A', 'Tâm $I(1; -2; 3)$, bán kính $R = \\sqrt{1^2 + (-2)^2 + 3^2 - (-2)} = \\sqrt{16} = 4$.'],
  ['dr-toan-33', 'Toán', 'Mặt cầu tiếp xúc mặt phẳng', 'Khó', 'Trong $Oxyz$, mặt cầu tâm $I(2; 1; -1)$ tiếp xúc với mặt phẳng $(\\alpha): 2x - y + 2z + 5 = 0$ có bán kính bằng:', ['$2$', '$3$', '$1$', '$6$'], 'A', '$R = d(I, (\\alpha)) = \\frac{|2(2) - 1 + 2(-1) + 5|}{\\sqrt{4 + 1 + 4}} = \\frac{6}{3} = 2$.'],
  ['dr-toan-34', 'Toán', 'Góc giữa hai mặt phẳng', 'TB', 'Trong $Oxyz$, góc giữa mặt phẳng $(P): x + y - 5 = 0$ và mặt phẳng $(Oxy): z = 0$ bằng:', ['$90^\\circ$', '$45^\\circ$', '$60^\\circ$', '$0^\\circ$'], 'A', '$\\vec{n}_P = (1;1;0), \\vec{k} = (0;0;1) \\Rightarrow \\vec{n}_P \\cdot \\vec{k} = 0 \\Rightarrow$ hai mặt phẳng vuông góc ($90^\\circ$).'],
  ['dr-toan-35', 'Toán', 'Thống kê mẫu ghép nhóm', 'Dễ', 'Cho mẫu số liệu ghép nhóm có giá trị nhỏ nhất của nhóm đầu là $10$ và đầu mút phải của nhóm cuối là $50$. Khoảng biến thiên $R$ của mẫu số liệu là:', ['$40$', '$60$', '$30$', '$25$'], 'A', 'Khoảng biến thiên $R = a_k - a_1 = 50 - 10 = 40$.'],
  ['dr-toan-36', 'Toán', 'Phương sai & Độ lệch chuẩn', 'TB', 'Nếu phương sai của một mẫu số liệu ghép nhóm bằng $s^2 = 6{,}25$ thì độ lệch chuẩn $s$ của mẫu đó bằng:', ['$2{,}5$', '$3{,}125$', '$39{,}06$', '$1{,}25$'], 'A', 'Độ lệch chuẩn $s = \\sqrt{s^2} = \\sqrt{6,25} = 2,5$.'],
  ['dr-toan-37', 'Toán', 'Xác suất biến cố độc lập', 'TB', 'Hai xạ thủ độc lập cùng bắn vào bia. Xác suất bắn trúng của người thứ nhất là $0{,}8$ và người thứ hai là $0{,}7$. Xác suất để có ít nhất một người bắn trúng bia là:', ['$0{,}94$', '$0{,}56$', '$0{,}38$', '$0{,}90$'], 'A', 'Xác suất cả hai cùng trượt là $0,2 \\times 0,3 = 0,06 \\Rightarrow P = 1 - 0,06 = 0,94$.'],
  ['dr-toan-38', 'Toán', 'Công thức Xác suất toàn phần', 'Khó', 'Hộp I có 3 bi đỏ, 2 bi xanh; Hộp II có 2 bi đỏ, 3 bi xanh. Chọn ngẫu nhiên 1 hộp rồi lấy ra 1 bi. Xác suất lấy được bi đỏ là:', ['$0{,}5$', '$0{,}6$', '$0{,}4$', '$0{,}25$'], 'A', '$P(\\text{Đỏ}) = \\frac{1}{2}\\cdot\\frac{3}{5} + \\frac{1}{2}\\cdot\\frac{2}{5} = \\frac{5}{10} = 0,5$.'],
  ['dr-toan-39', 'Toán', 'Định lý Bayes', 'Siêu khó', 'Một xét nghiệm y tế có độ nhạy 99% (dương tính khi có bệnh) và tỷ lệ dương tính giả là 2% (dương tính khi không bệnh). Biết tỷ lệ mắc bệnh trong quần thể là 1%. Nếu một người có kết quả dương tính, xác suất người đó thực sự mắc bệnh xấp xỉ:', ['$33{,}3\\%$', '$99{,}0\\%$', '$50{,}0\\%$', '$16{,}5\\%$'], 'A', 'Theo Bayes: $P(B|+) = \\frac{0,01 \\times 0,99}{0,01 \\times 0,99 + 0,99 \\times 0,02} = \\frac{0,0099}{0,0297} = \\frac{1}{3} \\approx 33,3\\%$.'],
  ['dr-toan-40', 'Toán', 'Hình học không gian (Thể tích chóp)', 'TB', 'Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác đều cạnh $a$, $SA \\perp (ABC)$ và $SA = a\\sqrt{3}$. Thể tích khối chóp $S.ABC$ bằng:', ['$\\frac{a^3}{4}$', '$\\frac{a^3\\sqrt{3}}{4}$', '$\\frac{a^3}{12}$', '$\\frac{3a^3}{4}$'], 'A', '$S_{ABC} = \\frac{a^2\\sqrt{3}}{4} \\Rightarrow V = \\frac{1}{3} \\cdot a\\sqrt{3} \\cdot \\frac{a^2\\sqrt{3}}{4} = \\frac{a^3}{4}$.'],
  ['dr-toan-41', 'Toán', 'Thể tích khối lăng trụ', 'Dễ', 'Khối lăng trụ đứng có diện tích đáy $B = 6\\text{ cm}^2$ và chiều cao $h = 5\\text{ cm}$ có thể tích bằng:', ['$30\\text{ cm}^3$', '$10\\text{ cm}^3$', '$15\\text{ cm}^3$', '$90\\text{ cm}^3$'], 'A', 'Thể tích khối lăng trụ $V = B \\cdot h = 6 \\times 5 = 30\\text{ cm}^3$.'],
  ['dr-toan-42', 'Toán', 'Góc đường thẳng & mặt phẳng', 'TB', 'Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a\\sqrt{2}$. Góc giữa $SC$ và mặt phẳng $(ABCD)$ bằng:', ['$45^\\circ$', '$60^\\circ$', '$30^\\circ$', '$90^\\circ$'], 'A', 'Hình chiếu của $SC$ lên $(ABCD)$ là $AC = a\\sqrt{2}$. $\\tan\\widehat{SCA} = \\frac{SA}{AC} = 1 \\Rightarrow 45^\\circ$.'],
  ['dr-toan-43', 'Toán', 'Cực trị hàm hợp', 'Siêu khó', 'Cho hàm số $y = f(x)$ có đạo hàm $f\'(x) = (x - 1)(x + 2)^2$. Hàm số $g(x) = f(x^2 - 3)$ có bao nhiêu điểm cực trị?', ['$3$', '$2$', '$1$', '$4$'], 'A', "$g'(x) = 2x \\cdot f'(x^2 - 3) = 2x(x^2 - 4)(x^2 - 1)^2$. Đạo hàm đổi dấu qua các nghiệm bội lẻ $x = 0, x = 2, x = -2 \\Rightarrow$ có 3 điểm cực trị."],
  ['dr-toan-44', 'Toán', 'Tích phân hàm ẩn', 'Khó', 'Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ thỏa mãn $\\int_0^4 f(x)dx = 12$. Giá trị của $I = \\int_0^2 f(2x)dx$ bằng:', ['$6$', '$24$', '$12$', '$3$'], 'A', 'Đặt $t = 2x \\Rightarrow dx = dt/2$. $I = \\frac{1}{2}\\int_0^4 f(t)dt = \\frac{12}{2} = 6$.'],
  ['dr-toan-45', 'Toán', 'Cực trị tọa độ Oxyz', 'Siêu khó', 'Trong $Oxyz$, cho hai điểm $A(1; 2; 3)$ và $B(3; 4; -1)$. Điểm $M$ thuộc mặt phẳng $(Oxy)$ sao cho $MA^2 + MB^2$ đạt giá trị nhỏ nhất có tọa độ là:', ['$(2; 3; 0)$', '$(2; 3; 1)$', '$(1; 2; 0)$', '$(3; 4; 0)$'], 'A', 'Gọi $I(2; 3; 1)$ là trung điểm $AB$. $MA^2 + MB^2 = 2MI^2 + \\frac{AB^2}{2}$ nhỏ nhất khi $M$ là hình chiếu của $I$ lên $(Oxy) \\Rightarrow M(2; 3; 0)$.'],
  ['dr-toan-46', 'Toán', 'Tổ hợp & Quy tắc đếm', 'Dễ', 'Một lớp có 20 học sinh nam và 15 học sinh nữ. Số cách chọn ra 1 đôi song ca gồm 1 nam và 1 nữ là:', ['$300$', '$35$', '$595$', '$150$'], 'A', 'Theo quy tắc nhân: $20 \\times 15 = 300$ cách.'],
  ['dr-toan-47', 'Toán', 'Nhị thức Newton', 'TB', 'Hệ số của $x^3$ trong khai triển $(2x + 1)^5$ bằng:', ['$80$', '$40$', '$10$', '$16$'], 'A', 'Số hạng chứa $x^3$ là $C_5^3 (2x)^3 \\cdot 1^2 = 10 \\cdot 8 x^3 = 80x^3$.'],
  ['dr-toan-48', 'Toán', 'Phương trình lượng giác', 'Dễ', 'Nghiệm của phương trình $\\cos x = 1$ là:', ['$x = k2\\pi\\;(k \\in \\mathbb{Z})$', '$x = k\\pi\\;(k \\in \\mathbb{Z})$', '$x = \\frac{\\pi}{2} + k2\\pi$', '$x = \\pi + k2\\pi$'], 'A', 'Phương trình lượng giác đặc biệt: $\\cos x = 1 \\Leftrightarrow x = k2\\pi$.'],
  ['dr-toan-49', 'Toán', 'Đạo hàm hàm hợp', 'TB', 'Đạo hàm của hàm số $y = \\ln(x^2 + 1)$ là:', ['$\\frac{2x}{x^2 + 1}$', '$\\frac{1}{x^2 + 1}$', '$\\frac{x}{x^2 + 1}$', '$2x\\ln(x^2 + 1)$'], 'A', "$(\\ln u)' = \\frac{u'}{u} = \\frac{2x}{x^2 + 1}$."],
  ['dr-toan-50', 'Toán', 'Lãi kép thực tế', 'Khó', 'Gửi $100$ triệu đồng vào ngân hàng với lãi suất $6\\%$/năm theo hình thức lãi kép hàng năm. Sau đúng $5$ năm, tổng số tiền cả vốn lẫn lãi thu được gần nhất với:', ['$133{,}82$ triệu đồng', '$130{,}00$ triệu đồng', '$126{,}25$ triệu đồng', '$140{,}25$ triệu đồng'], 'A', '$T = 100 \\times (1 + 0,06)^5 \\approx 133,82$ triệu đồng.'],

  // ==================== HÓA HỌC (50 CÂU) ====================
  ['dr-hoa-1', 'Hóa học', 'Ester – Lipid', 'Dễ', 'Thủy phân ethyl acetate ($\\text{CH}_3\\text{COOC}_2\\text{H}_5$) trong dung dịch NaOH đun nóng thu được muối có công thức là:', ['$\\text{CH}_3\\text{COONa}$', '$\\text{C}_2\\text{H}_5\\text{ONa}$', '$\\text{HCOONa}$', '$\\text{C}_2\\text{H}_5\\text{COONa}$'], 'A', 'Phản ứng xà phòng hóa tạo sodium acetate ($\\text{CH}_3\\text{COONa}$) và ethanol.'],
  ['dr-hoa-2', 'Hóa học', 'Polime & Tơ sợi', 'TB', 'Polime nào sau đây được điều chế bằng phản ứng trùng ngưng?', ['Nylon-6,6', 'Polietilen (PE)', 'Poly(vinyl chloride) (PVC)', 'Polistiren (PS)'], 'A', 'Nylon-6,6 được tổng hợp bằng phản ứng trùng ngưng giữa hexamethylenediamine và adipic acid.'],
  ['dr-hoa-3', 'Hóa học', 'Đại cương Kim loại', 'Khó', 'Kim loại nào sau đây tan được trong dung dịch $\\text{Fe}_2(\\text{SO}_4)_3$ dư nhưng KHÔNG tan trong dung dịch HCl loãng?', ['Cu', 'Fe', 'Mg', 'Al'], 'A', 'Cu đứng sau H nên không tan trong HCl, nhưng khử được $\\text{Fe}^{3+}$ về $\\text{Fe}^{2+}$: $\\text{Cu} + 2\\text{Fe}^{3+} \\to \\text{Cu}^{2+} + 2\\text{Fe}^{2+}$.'],
  ['dr-hoa-4', 'Hóa học', 'Pin điện hóa & Điện phân', 'Siêu khó', 'Điện phân dung dịch chứa $0{,}1\\text{ mol CuSO}_4$ và $0{,}1\\text{ mol KCl}$ (điện cực trơ, màng ngăn) đến khi catot bắt đầu thoát khí thì dừng lại. Số mol khí thu được ở anot là:', ['$0{,}075\\text{ mol}$', '$0{,}050\\text{ mol}$', '$0{,}100\\text{ mol}$', '$0{,}025\\text{ mol}$'], 'A', 'Catot vừa hết $\\text{Cu}^{2+} \\Rightarrow n_e = 0,2\\text{ mol}$. Ở anot: $0,1\\text{ mol Cl}^- \\to 0,05\\text{ mol Cl}_2$ (nhường 0,1e); còn 0,1e điện phân $\\text{H}_2\\text{O}$ tạo $0,025\\text{ mol O}_2$. Tổng khí = $0,075\\text{ mol}$.'],
  ['dr-hoa-5', 'Hóa học', 'Danh pháp Ester', 'Dễ', 'Hợp chất $\\text{HCOOCH}_3$ có tên gọi theo danh pháp IUPAC là:', ['Methyl formate (Methyl methanoate)', 'Ethyl acetate', 'Methyl acetate', 'Ethyl formate'], 'A', '$\\text{HCOOCH}_3$ là ester của formic acid và methanol nên gọi là methyl formate.'],
  ['dr-hoa-6', 'Hóa học', 'Tính chất Ester đặc biệt', 'TB', 'Thủy phân hoàn toàn vinyl acetate ($\\text{CH}_3\\text{COOCH=CH}_2$) trong dung dịch NaOH đun nóng thu được sản phẩm gồm:', ['$\\text{CH}_3\\text{COONa}$ và $\\text{CH}_3\\text{CHO}$', '$\\text{CH}_3\\text{COONa}$ và $\\text{CH}_2\\text{=CHOH}$', '$\\text{HCOONa}$ và $\\text{C}_2\\text{H}_5\\text{OH}$', '$\\text{CH}_3\\text{COOH}$ và $\\text{CH}_3\\text{CHO}$'], 'A', 'Gốc vinyl tạo alcohol không bền tự chuyển vị thành acetaldehyde ($\\text{CH}_3\\text{CHO}$).'],
  ['dr-hoa-7', 'Hóa học', 'Ester của Phenol', 'Khó', 'Cho $0{,}1\\text{ mol}$ phenyl acetate ($\\text{CH}_3\\text{COOC}_6\\text{H}_5$) tác dụng tối đa với bao nhiêu mol NaOH trong dung dịch?', ['$0{,}2\\text{ mol}$', '$0{,}1\\text{ mol}$', '$0{,}3\\text{ mol}$', '$0{,}15\\text{ mol}$'], 'A', 'Ester của phenol phản ứng theo tỉ lệ 1:2 tạo 2 muối ($\\text{CH}_3\\text{COONa} + \\text{C}_6\\text{H}_5\\text{ONa}$) và $\\text{H}_2\\text{O}$.'],
  ['dr-hoa-8', 'Hóa học', 'Lipid & Chất béo', 'Dễ', 'Chất béo là triester của các acid béo với alcohol nào sau đây?', ['Glycerol', 'Ethylene glycol', 'Ethanol', 'Methanol'], 'A', 'Chất béo (triglyceride) là triester của glycerol $\\text{C}_3\\text{H}_5(\\text{OH})_3$ và các acid béo.'],
  ['dr-hoa-9', 'Hóa học', 'Hydrogen hóa chất béo', 'TB', 'Đun nóng triolein $(\\text{C}_{17}\\text{H}_{33}\\text{COO})_3\\text{C}_3\\text{H}_5$ với $\\text{H}_2$ dư (xúc tác Ni, $t^\\circ$) thu được chất béo rắn là:', ['Tristearin', 'Tripalmitin', 'Trilinolein', 'Glycerol'], 'A', 'Gốc oleate ($\\text{C}_{17}\\text{H}_{33}-$, 1 nối đôi) cộng $\\text{H}_2$ tạo gốc stearate ($\\text{C}_{17}\\text{H}_{35}-$).'],
  ['dr-hoa-10', 'Hóa học', 'Xà phòng & Chất giặt rửa', 'Dễ', 'Ưu điểm của chất giặt rửa tổng hợp so với xà phòng là:', ['Dùng giặt rửa được cả trong nước cứng', 'Phân hủy sinh học hoàn toàn không gây ô nhiễm', 'Làm từ mỡ động vật tự nhiên', 'Tạo kết tủa với ion $\\text{Ca}^{2+}, \\text{Mg}^{2+}$'], 'A', 'Muối sulfonate của chất giặt rửa tổng hợp tan tốt, không kết tủa với $\\text{Ca}^{2+}, \\text{Mg}^{2+}$ trong nước cứng.'],
  ['dr-hoa-11', 'Hóa học', 'Carbohydrate – Glucose', 'Dễ', 'Trong máu người trưởng thành khỏe mạnh lúc đói, nồng độ glucose được duy trì ổn định ở mức khoảng:', ['$4{,}4 - 7{,}2\\text{ mmol/L}$ (khoảng $0{,}1\\%$)', '$1{,}0\\%$', '$5{,}0\\%$', '$0{,}01\\%$'], 'A', 'Nồng độ glucose trong máu người bình thường khoảng $4,4 - 7,2\\text{ mmol/L}$ ($\\approx 0,1\\%$).'],
  ['dr-hoa-12', 'Hóa học', 'Phản ứng tráng bạc', 'TB', 'Cho $18\\text{ gam}$ glucose ($\text{M}=180$) thực hiện phản ứng tráng bạc hoàn toàn với thuốc thử Tollens dư. Khối lượng Ag kết tủa thu được là:', ['$21{,}6\\text{ gam}$', '$10{,}8\\text{ gam}$', '$43{,}2\\text{ gam}$', '$32{,}4\\text{ gam}$'], 'A', '$n_{\\text{glucose}} = 0,1\\text{ mol} \\Rightarrow n_{\\text{Ag}} = 2 \\times 0,1 = 0,2\\text{ mol} \\Rightarrow m_{\\text{Ag}} = 21,6\\text{ g}$.'],
  ['dr-hoa-13', 'Hóa học', 'Saccharose & Maltose', 'TB', 'Thủy phân hoàn toàn saccharose trong môi trường acid thu được:', ['Glucose và fructose', 'Chỉ có glucose', 'Chỉ có fructose', 'Glucose và galactose'], 'A', 'Saccharose cấu tạo từ 1 gốc $\\alpha$-glucose và 1 gốc $\\beta$-fructose.'],
  ['dr-hoa-14', 'Hóa học', 'Tinh bột & Iodine', 'Dễ', 'Nhỏ vài giọt dung dịch iodine ($\\text{I}_2$) vào mặt cắt củ khoai lang hoặc hồ tinh bột sẽ xuất hiện màu:', ['Xanh tím', 'Đỏ gạch', 'Vàng tươi', 'Tím hồng'], 'A', 'Amylose trong tinh bột có cấu trúc xoắn lò xo hấp phụ phân tử $\\text{I}_2$ tạo màu xanh tím đặc trưng.'],
  ['dr-hoa-15', 'Hóa học', 'Cellulose trinitrate', 'Khó', 'Đun nóng cellulose với hỗn hợp $\\text{HNO}_3$ đặc và $\\text{H}_2\\text{SO}_4$ đặc thu được thuốc súng không khói có công thức là:', ['$[\\text{C}_6\\text{H}_7\\text{O}_2(\\text{ONO}_2)_3]_n$', '$[\\text{C}_6\\text{H}_7\\text{O}_2(\\text{NO}_2)_3]_n$', '$[\\text{C}_6\\text{H}_8\\text{O}_2(\\text{ONO}_2)_2]_n$', '$\\text{C}_6\\text{H}_3(\\text{NO}_2)_3$'], 'A', 'Phản ứng ester hóa 3 nhóm OH tự do của mỗi mắt xích cellulose tạo cellulose trinitrate.'],
  ['dr-hoa-16', 'Hóa học', 'Amine & Tính base', 'TB', 'Sắp xếp theo chiều tăng dần lực base của các chất: (1) ammonia, (2) methylamine, (3) aniline là:', ['(3) < (1) < (2)', '(1) < (2) < (3)', '(2) < (1) < (3)', '(3) < (2) < (1)'], 'A', 'Gốc phenyl hút e làm giảm lực base của aniline; gốc methyl đẩy e làm tăng lực base của methylamine: $\\text{C}_6\\text{H}_5\\text{NH}_2 < \\text{NH}_3 < \\text{CH}_3\\text{NH}_2$.'],
  ['dr-hoa-17', 'Hóa học', 'Nhận biết Aniline', 'Dễ', 'Nhỏ nước bromine vào dung dịch aniline ($\\text{C}_6\\text{H}_5\\text{NH}_2$) thấy xuất hiện hiện tượng:', ['Kết tủa trắng 2,4,6-tribromoaniline', 'Kết tủa vàng', 'Dung dịch chuyển màu xanh tím', 'Sủi bọt khí không màu'], 'A', 'Aniline thế nguyên tử H ở vòng benzene rất dễ với $\\text{Br}_2$ tạo kết tủa trắng 2,4,6-tribromoaniline.'],
  ['dr-hoa-18', 'Hóa học', 'Amino acid & Quỳ tím', 'TB', 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?', ['Lysine', 'Glycine', 'Alanine', 'Glutamic acid'], 'A', 'Lysine có 2 nhóm $-\\text{NH}_2$ và 1 nhóm $-\\text{COOH}$ nên môi trường kiềm, làm quỳ tím hóa xanh.'],
  ['dr-hoa-19', 'Hóa học', 'Điểm đẳng điện & Điện di', 'Khó', 'Ở $\\text{pH} = 6{,}0$, khi đặt hỗn hợp gồm Glycine ($\\text{pI}=6{,}0$), Lysine ($\\text{pI}=9{,}7$) và Glutamic acid ($\\text{pI}=3{,}2$) vào điện trường thì:', ['Lysine di chuyển về cực âm, Glutamic acid về cực dương, Glycine đứng yên', 'Lysine về cực dương, Glutamic acid về cực âm', 'Cả 3 cùng di chuyển về cực âm', 'Glycine về cực âm, Lysine đứng yên'], 'A', 'Tại $\\text{pH} = 6,0$: Lysine tích điện dương (về catot $-$), Glu tích điện âm (về anot $+$), Gly tồn tại dạng ion lưỡng cực trung hòa đứng yên.'],
  ['dr-hoa-20', 'Hóa học', 'Peptide & Phản ứng màu Biuret', 'Dễ', 'Hợp chất nào sau đây KHÔNG có phản ứng màu biuret với $\\text{Cu(OH)}_2/\\text{OH}^-$?', ['Gly-Ala (dipeptide)', 'Gly-Ala-Val (tripeptide)', 'Ala-Gly-Gly-Val', 'Albumin (lòng trắng trứng)'], 'A', 'Dipeptide chỉ có 1 liên kết peptide nên không tạo phức màu tím biuret (cần từ tripeptide trở lên).'],
  ['dr-hoa-21', 'Hóa học', 'Thủy phân Peptide', 'Khó', 'Số liên kết peptide trong một phân tử pentapeptide mạch hở Ala-Gly-Val-Gly-Ala là:', ['$4$', '$5$', '$3$', '$6$'], 'A', 'Phân tử $n$-peptide mạch hở chứa $n - 1$ liên kết peptide ($5 - 1 = 4$).'],
  ['dr-hoa-22', 'Hóa học', 'Protein & Đông tụ', 'Dễ', 'Hiện tượng riêu cua nổi lên khi nấu canh cua hoặc luộc trứng lòng trắng đông lại là do:', ['Sự đông tụ protein bởi nhiệt độ', 'Sự thủy phân hoàn toàn protein', 'Phản ứng xà phòng hóa chất béo', 'Phản ứng màu biuret'], 'A', 'Protein hình cầu tan trong nước bị biến tính và đông tụ khi đun nóng.'],
  ['dr-hoa-23', 'Hóa học', 'Vật liệu Polymer – Cao su', 'TB', 'Quá trình lưu hóa cao su (đun cao su với sulfur) làm tăng tính đàn hồi và độ bền cơ học là do tạo thành:', ['Cầu nối disulfide ($-\\text{S}-\\text{S}-$) tạo mạng không gian', 'Mạch polymer phân nhánh ngắn', 'Phản ứng cắt mạch polymer', 'Liên kết hydrogen giữa các chuỗi'], 'A', 'Lưu hóa cao su tạo các cầu nối $-\\text{S}-\\text{S}-$ nối các mạch polyisoprene thành mạng không gian.'],
  ['dr-hoa-24', 'Hóa học', 'Tơ thiên nhiên & Tơ tổng hợp', 'TB', 'Tơ nào sau đây thuộc loại tơ bán tổng hợp (tơ nhân tạo)?', ['Tơ visco và tơ cellulose acetate', 'Tơ tằm và sợi bông', 'Tơ capron và tơ olon', 'Nylon-6,6 và tơ nitron'], 'A', 'Tơ visco và tơ acetate được chế biến hóa học từ polymer thiên nhiên là cellulose.'],
  ['dr-hoa-25', 'Hóa học', 'Thế điện cực chuẩn & Pin Galvani', 'TB', 'Cho $E^\\circ_{\\text{Zn}^{2+}/\\text{Zn}} = -0{,}76\\text{ V}$ và $E^\\circ_{\\text{Cu}^{2+}/\\text{Cu}} = +0{,}34\\text{ V}$. Suất điện động chuẩn $E^\\circ_{\\text{pin}}$ của pin Galvani Zn–Cu bằng:', ['$1{,}10\\text{ V}$', '$0{,}42\\text{ V}$', '$-1{,}10\\text{ V}$', '$0{,}76\\text{ V}$'], 'A', '$E^\\circ_{\\text{pin}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}} = 0,34 - (-0,76) = 1,10\\text{ V}$.'],
  ['dr-hoa-26', 'Hóa học', 'Cực của Pin điện hóa', 'Dễ', 'Trong pin điện hóa Zn–Cu đang hoạt động, quá trình xảy ra ở cực âm (anode) là:', ['Sự oxi hóa kẽm: $\\text{Zn} \\to \\text{Zn}^{2+} + 2e$', 'Sự khử ion đồng: $\\text{Cu}^{2+} + 2e \\to \\text{Cu}$', 'Sự khử kẽm: $\\text{Zn}^{2+} + 2e \\to \\text{Zn}$', 'Sự oxi hóa đồng: $\\text{Cu} \\to \\text{Cu}^{2+} + 2e$'], 'A', 'Ở anode (cực âm của pin Galvani) luôn xảy ra quá trình oxi hóa kim loại mạnh hơn.'],
  ['dr-hoa-27', 'Hóa học', 'Điều chế Kim loại', 'Dễ', 'Phương pháp dùng để điều chế kim loại nhôm (Al) trong công nghiệp là:', ['Điện phân nóng chảy $\\text{Al}_2\\text{O}_3$ có mặt cryolite', 'Điện phân dung dịch $\\text{AlCl}_3$', 'Dùng CO khử $\\text{Al}_2\\text{O}_3$ ở nhiệt độ cao', 'Dùng Fe đẩy Al ra khỏi muối'], 'A', 'Các kim loại mạnh từ Li đến Al chỉ điều chế bằng điện phân nóng chảy.'],
  ['dr-hoa-28', 'Hóa học', 'Ăn mòn điện hóa', 'TB', 'Để bảo vệ vỏ tàu biển làm bằng thép khỏi bị ăn mòn điện hóa, người ta gắn vào phần vỏ tàu chìm trong nước biển các tấm kim loại:', ['Kẽm (Zn)', 'Đồng (Cu)', 'Chì (Pb)', 'Bạc (Ag)'], 'A', 'Zn hoạt động mạnh hơn Fe nên đóng vai trò anode hi sinh bị ăn mòn thay cho vỏ thép.'],
  ['dr-hoa-29', 'Hóa học', 'Kim loại thụ động hóa', 'Dễ', 'Ba kim loại bị thụ động hóa trong dung dịch $\\text{HNO}_3$ đặc, nguội và $\\text{H}_2\\text{SO}_4$ đặc, nguội là:', ['Al, Fe, Cr', 'Cu, Fe, Ag', 'Al, Zn, Mg', 'Fe, Cu, Zn'], 'A', 'Al, Fe, Cr tạo màng oxide bền vững bảo vệ nên không phản ứng với $\\text{HNO}_3$ đặc nguội và $\\text{H}_2\\text{SO}_4$ đặc nguội.'],
  ['dr-hoa-30', 'Hóa học', 'Nước cứng & Làm mềm nước', 'TB', 'Chất nào sau đây có khả năng làm mềm được cả nước cứng tạm thời và nước cứng vĩnh cửu?', ['$\\text{Na}_2\\text{CO}_3$ (hoặc $\\text{Na}_3\\text{PO}_4$)', '$\\text{Ca(OH)}_2$ vừa đủ', '$\\text{NaCl}$', '$\\text{HCl}$'], 'A', 'Ion $\\text{CO}_3^{2-}$ và $\\text{PO}_4^{3-}$ kết tủa hoàn toàn $\\text{Ca}^{2+}, \\text{Mg}^{2+}$ trong mọi loại nước cứng.'],
  ['dr-hoa-31', 'Hóa học', 'Quy trình Solvay', 'Khó', 'Trong công nghiệp, soda ($\\text{Na}_2\\text{CO}_3$) và baking soda ($\\text{NaHCO}_3$) được sản xuất theo phương pháp Solvay từ nguyên liệu chính là:', ['Muối ăn ($\\text{NaCl}$), đá vôi ($\\text{CaCO}_3$) và ammonia ($\\text{NH}_3$)', '$\\text{NaOH}$ đặc và khí $\\text{CO}_2$', '$\\text{Na}_2\\text{SO}_4$ và than cốc', 'Kim loại Na và nước biển'], 'A', 'Phương pháp Solvay dẫn $\\text{CO}_2$ vào dung dịch bão hòa $\\text{NaCl}$ và $\\text{NH}_3$ để kết tinh $\\text{NaHCO}_3$ ít tan.'],
  ['dr-hoa-32', 'Hóa học', 'Hợp chất của Calcium', 'Dễ', 'Thạch cao nung dùng để bó bột khi gãy xương và đúc tượng có công thức hóa học là:', ['$\\text{CaSO}_4\\cdot\\text{H}_2\\text{O}$ (hoặc $\\text{CaSO}_4\\cdot 0{,}5\\text{H}_2\\text{O}$)', '$\\text{CaSO}_4\\cdot 2\\text{H}_2\\text{O}$', '$\\text{CaCO}_3$', '$\\text{CaO}$'], 'A', 'Thạch cao sống ($\\text{CaSO}_4\\cdot 2\\text{H}_2\\text{O}$) nung ở $\\sim 160^\\circ\\text{C}$ tạo thạch cao nung có khả năng kết cứng khi nhào với nước.'],
  ['dr-hoa-33', 'Hóa học', 'Hợp chất Lưỡng tính', 'TB', 'Dãy gồm các chất đều có tính chất lưỡng tính là:', ['$\\text{Al(OH)}_3,\\; \\text{Al}_2\\text{O}_3,\\; \\text{NaHCO}_3,\\; \\text{Cr(OH)}_3$', '$\\text{Al(OH)}_3,\\; \\text{Fe(OH)}_3,\\; \\text{ZnO}$', '$\\text{NaHCO}_3,\\; \\text{Na}_2\\text{CO}_3,\\; \\text{Al}_2\\text{O}_3$', '$\\text{CrO}_3,\\; \\text{Cr}_2\\text{O}_3,\\; \\text{Al}_2\\text{O}_3$'], 'A', 'Các chất $\\text{Al(OH)}_3, \\text{Al}_2\\text{O}_3, \\text{NaHCO}_3, \\text{Cr(OH)}_3$ đều tác dụng được với cả dung dịch HCl và NaOH.'],
  ['dr-hoa-34', 'Hóa học', 'Phản ứng Nhiệt nhôm', 'TB', 'Thực hiện phản ứng nhiệt nhôm hoàn toàn hỗn hợp gồm $0{,}2\\text{ mol Al}$ và $0{,}15\\text{ mol Fe}_2\\text{O}_3$ (không có không khí). Khối lượng sắt (Fe) tạo thành là:', ['$11{,}2\\text{ gam}$', '$16{,}8\\text{ gam}$', '$5{,}6\\text{ gam}$', '$8{,}4\\text{ gam}$'], 'A', '$2\\text{Al} + \\text{Fe}_2\\text{O}_3 \\to \\text{Al}_2\\text{O}_3 + 2\\text{Fe}$. Al hết ($0,2\\text{ mol}$) $\\Rightarrow n_{\\text{Fe}} = 0,2\\text{ mol} \\Rightarrow m_{\\text{Fe}} = 11,2\\text{ g}$.'],
  ['dr-hoa-35', 'Hóa học', 'Hợp chất của Sắt', 'TB', 'Cho dung dịch $\\text{FeCl}_2$ tác dụng với lượng dư dung dịch $\\text{AgNO}_3$, kết tủa thu được gồm:', ['$\\text{AgCl}$ và $\\text{Ag}$', 'Chỉ có $\\text{AgCl}$', 'Chỉ có $\\text{Ag}$', '$\\text{Fe(OH)}_3$ và $\\text{AgCl}$'], 'A', '$\\text{Cl}^- + \\text{Ag}^+ \\to \\text{AgCl}\\downarrow$ và $\\text{Fe}^{2+} + \\text{Ag}^+ \\to \\text{Fe}^{3+} + \\text{Ag}\\downarrow$.'],
  ['dr-hoa-36', 'Hóa học', 'Màu sắc hợp chất Chromium', 'TB', 'Khi nhỏ dung dịch NaOH vào dung dịch $\\text{K}_2\\text{Cr}_2\\text{O}_7$ (màu da cam), dung dịch chuyển sang màu:', ['Vàng (do tạo $\\text{CrO}_4^{2-}$)', 'Xanh lục', 'Tím', 'Không màu'], 'A', 'Trong môi trường kiềm: $\\text{Cr}_2\\text{O}_7^{2-} \\text{ (da cam)} + 2\\text{OH}^- \\rightleftharpoons 2\\text{CrO}_4^{2-} \\text{ (vàng)} + \\text{H}_2\\text{O}$.'],
  ['dr-hoa-37', 'Hóa học', 'Phức chất kim loại chuyển tiếp', 'Khó', 'Trong phức chất $[\\text{Cu(NH}_3)_4](\\text{OH})_2$, số phối trí của nguyên tử trung tâm $\\text{Cu}^{2+}$ bằng:', ['$4$', '$2$', '$6$', '$1$'], 'A', 'Có 4 phối tử $\\text{NH}_3$ đơn càng liên kết trực tiếp với $\\text{Cu}^{2+}$ trong cầu nội nên số phối trí là 4.'],
  ['dr-hoa-38', 'Hóa học', 'Cân bằng hóa học Le Chatelier', 'TB', 'Cho cân bằng tổng hợp ammonia: $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)\\; (\\Delta_r H^\\circ_{298} < 0)$. Để cân bằng chuyển dịch theo chiều thuận, cần:', ['Tăng áp suất chung và giảm nhiệt độ hợp lý', 'Giảm áp suất và tăng nhiệt độ', 'Tăng nhiệt độ và thêm xúc tác Fe', 'Giữ nguyên áp suất và tăng nhiệt độ'], 'A', 'Phản ứng thuận làm giảm số mol khí (4 → 2) và tỏa nhiệt nên tăng áp suất, giảm nhiệt độ giúp chuyển dịch theo chiều thuận.'],
  ['dr-hoa-39', 'Hóa học', 'Chuẩn độ oxi hóa - khử', 'Khó', 'Chuẩn độ $20\\text{ mL}$ dung dịch $\\text{FeSO}_4$ trong môi trường $\\text{H}_2\\text{SO}_4$ loãng cần vừa đủ $15\\text{ mL}$ dung dịch $\\text{KMnO}_4\\; 0{,}02\\text{ M}$. Nồng độ mol của dung dịch $\\text{FeSO}_4$ là:', ['$0{,}075\\text{ M}$', '$0{,}015\\text{ M}$', '$0{,}030\\text{ M}$', '$0{,}150\\text{ M}$'], 'A', 'Bảo toàn electron: $n_{\\text{Fe}^{2+}} = 5 n_{\\text{KMnO}_4} = 5 \\times 0,015 \\times 0,02 = 0,0015\\text{ mol} \\Rightarrow C_M = \\frac{0,0015}{0,02} = 0,075\\text{ M}$.'],
  ['dr-hoa-40', 'Hóa học', 'pH của dung dịch', 'Dễ', 'Dung dịch $\\text{NaOH}\\; 0{,}01\\text{ M}$ ở $25^\\circ\\text{C}$ có giá trị pH bằng:', ['$12$', '$2$', '$11$', '$13$'], 'A', '$[\\text{OH}^-] = 10^{-2}\\text{ M} \\Rightarrow \\text{pOH} = 2 \\Rightarrow \\text{pH} = 14 - 2 = 12$.'],
  ['dr-hoa-41', 'Hóa học', 'Mưa acid & Môi trường', 'Dễ', 'Hai khí chính gây ra hiện tượng mưa acid trong khí quyển là:', ['$\\text{SO}_2$ và $\\text{NO}_x$', '$\\text{CO}_2$ và $\\text{CH}_4$', '$\\text{CO}$ và $\\text{NH}_3$', '$\\text{H}_2\\text{S}$ và $\\text{O}_3$'], 'A', '$\\text{SO}_2$ và $\\text{NO}_x$ bị oxi hóa trong khí quyển tạo $\\text{H}_2\\text{SO}_4$ và $\\text{HNO}_3$ hòa tan trong nước mưa.'],
  ['dr-hoa-42', 'Hóa học', 'Nhận biết muối Sulfate', 'Dễ', 'Thuốc thử đặc trưng để nhận biết ion $\\text{SO}_4^{2-}$ trong dung dịch là:', ['Dung dịch muối $\\text{Ba}^{2+}$ (như $\\text{BaCl}_2$) trong môi trường acid', 'Dung dịch $\\text{AgNO}_3$', 'Dung dịch $\\text{NaOH}$', 'Quỳ tím ẩm'], 'A', '$\\text{Ba}^{2+} + \\text{SO}_4^{2-} \\to \\text{BaSO}_4\\downarrow$ trắng bền trong các acid mạnh.'],
  ['dr-hoa-43', 'Hóa học', 'Halogen & Tính acid HX', 'TB', 'Trong dãy hydrohalic acid từ $\\text{HF} \\to \\text{HCl} \\to \\text{HBr} \\to \\text{HI}$, tính acid biến đổi như thế nào?', ['Tăng dần từ HF đến HI', 'Giảm dần từ HF đến HI', 'Không đổi', 'HF mạnh nhất, HI yếu nhất'], 'A', 'Do độ dài liên kết H–X tăng và năng lượng liên kết giảm nên tính acid tăng mạnh từ HF (yếu) đến HI (rất mạnh).'],
  ['dr-hoa-44', 'Hóa học', 'Phản ứng tráng gương Ester', 'TB', 'Ester nào sau đây có khả năng tham gia phản ứng tráng bạc với thuốc thử Tollens?', ['Ethyl formate ($\\text{HCOOC}_2\\text{H}_5$)', 'Methyl acetate ($\\text{CH}_3\\text{COOCH}_3$)', 'Ethyl propionate', 'Methyl acrylate'], 'A', 'Các ester của formic acid ($\\text{HCOOR}$) có nhóm chức $-\\text{CHO}$ ở đầu mạch nên tráng bạc được.'],
  ['dr-hoa-45', 'Hóa học', 'Lên men rượu từ Tinh bột', 'Khó', 'Lên men $162\\text{ gam}$ tinh bột với hiệu suất toàn quá trình là $80\\%$, khối lượng ethanol ($\\text{C}_2\\text{H}_5\\text{OH}$) thu được là:', ['$73{,}6\\text{ gam}$', '$92{,}0\\text{ gam}$', '$46{,}0\\text{ gam}$', '$36{,}8\\text{ gam}$'], 'A', '$n_{\\text{mắt xích}} = \\frac{162}{162} = 1\\text{ mol} \\to 2\\text{ mol C}_2\\text{H}_5\\text{OH}$. Nhân hiệu suất $80\\%$: $m = 2 \\times 46 \\times 0,8 = 73,6\\text{ g}$.'],
  ['dr-hoa-46', 'Hóa học', 'Điều chế Aspirin / Methyl salicylate', 'Khó', 'Dầu gió xanh chứa methyl salicylate được điều chế bằng phản ứng ester hóa giữa salicylic acid và chất nào sau đây?', ['Methanol ($\\text{CH}_3\\text{OH}$)', 'Acetic anhydride', 'Ethanol', 'Phenol'], 'A', 'Nhóm $-\\text{COOH}$ của salicylic acid ester hóa với $\\text{CH}_3\\text{OH}$ (xúc tác $\\text{H}_2\\text{SO}_4$ đặc) tạo methyl salicylate.'],
  ['dr-hoa-47', 'Hóa học', 'Tơ Nylon-6 & Caprolactam', 'TB', 'Polime dùng để sản xuất tơ capron (nylon-6) có công thức một mắt xích là:', ['$-\\text{NH}-[\\text{CH}_2]_5-\\text{CO}-$', '$-\\text{NH}-[\\text{CH}_2]_6-\\text{CO}-$', '$-\\text{NH}-[\\text{CH}_2]_6-\\text{NH}-\\text{CO}-[\\text{CH}_2]_4-\\text{CO}-$', '$-\\text{CH}_2-\\text{CH(CN)}-$'], 'A', 'Tơ capron (nylon-6) tạo từ $\\varepsilon$-aminocaproic acid (6 nguyên tử C) nên có 5 nhóm $-\\text{CH}_2-$.'],
  ['dr-hoa-48', 'Hóa học', 'Chất dẻo PMMA (Thủy tinh hữu cơ)', 'TB', 'Monomer dùng để trùng hợp tạo thủy tinh hữu cơ (plexiglas) là:', ['Methyl methacrylate ($\\text{CH}_2\\text{=C(CH}_3\\text{)COOCH}_3$)', 'Methyl acrylate', 'Vinyl acetate', 'Styrene'], 'A', 'Poly(methyl methacrylate) được trùng hợp từ methyl methacrylate.'],
  ['dr-hoa-49', 'Hóa học', 'Bảo toàn e – Hòa tan kim loại', 'Siêu khó', 'Hòa tan hoàn toàn $5{,}6\\text{ gam Fe}$ trong dung dịch $\\text{HNO}_3$ loãng dư, thu được $V\\text{ lít}$ khí $\\text{NO}$ (sản phẩm khử duy nhất, ở đkc $25^\\circ\\text{C}, 1\\text{ bar}$). Giá trị của $V$ là:', ['$2{,}479\\text{ lít}$', '$4{,}958\\text{ lít}$', '$3{,}718\\text{ lít}$', '$1{,}239\\text{ lít}$'], 'A', '$n_{\\text{Fe}} = 0,1\\text{ mol}$. Bảo toàn e: $3n_{\\text{Fe}} = 3n_{\\text{NO}} \\Rightarrow n_{\\text{NO}} = 0,1\\text{ mol} \\Rightarrow V = 0,1 \\times 24,79 = 2,479\\text{ L}$.'],
  ['dr-hoa-50', 'Hóa học', 'Độ tan & Tinh thể ngậm nước', 'Siêu khó', 'Hòa tan hoàn toàn $25\\text{ gam CuSO}_4\\cdot 5\\text{H}_2\\text{O}$ ($M=250$) vào $175\\text{ gam}$ nước thu được dung dịch $\\text{CuSO}_4$ có nồng độ phần trăm là:', ['$8{,}0\\%$', '$12{,}5\\%$', '$10{,}0\\%$', '$16{,}0\\%$'], 'A', '$n_{\\text{CuSO}_4} = \\frac{25}{250} = 0,1\\text{ mol} \\Rightarrow m_{\\text{CuSO}_4} = 16\\text{ g}$. $m_{\\text{dd}} = 25 + 175 = 200\\text{ g} \\Rightarrow C\\% = \\frac{16}{200} = 8,0\\%$.'],

  // ==================== VẬT LÍ (45 CÂU) ====================
  ['dr-li-1', 'Vật lí', 'Vật lí nhiệt 12', 'Dễ', 'Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn khối chất rắn kết tinh có khối lượng $m$ ở nhiệt độ nóng chảy là:', ['$Q = \\lambda m$', '$Q = L m$', '$Q = m c \\Delta T$', '$Q = \\frac{3}{2} n R T$'], 'A', 'Công thức nhiệt nóng chảy là $Q = \\lambda m$ (với $\\lambda$ là nhiệt nóng chảy riêng).'],
  ['dr-li-2', 'Vật lí', 'Khí lí tưởng', 'TB', 'Đun đẳng tích một lượng khí lí tưởng từ $27^\\circ\\text{C}$ lên $127^\\circ\\text{C}$. Áp suất khí tăng lên bao nhiêu lần?', ['$4/3$ lần', '$3/4$ lần', '$127/27$ lần', '$2$ lần'], 'A', '$T_1 = 300\\text{ K}, T_2 = 400\\text{ K} \\Rightarrow \\frac{p_2}{p_1} = \\frac{T_2}{T_1} = \\frac{4}{3}$.'],
  ['dr-li-3', 'Vật lí', 'Từ trường & Cảm ứng điện từ', 'Khó', 'Suất điện động cảm ứng xuất hiện khi từ thông qua mạch biến thiên đều $\\Delta \\Phi = 0{,}6\\text{ Wb}$ trong $0{,}02\\text{ s}$ có độ lớn là:', ['$30\\text{ V}$', '$12\\text{ V}$', '$0{,}012\\text{ V}$', '$15\\text{ V}$'], 'A', '$|e_c| = \\left|\\frac{\\Delta \\Phi}{\\Delta t}\\right| = \\frac{0,6}{0,02} = 30\\text{ V}$.'],
  ['dr-li-4', 'Vật lí', 'Thang nhiệt độ Kelvin', 'Dễ', 'Nhiệt độ cơ thể người bình thường là $37^\\circ\\text{C}$, tương ứng với bao nhiêu Kelvin trong thang nhiệt độ tuyệt đối?', ['$310\\text{ K}$', '$236\\text{ K}$', '$300\\text{ K}$', '$337\\text{ K}$'], 'A', '$T(\\text{K}) = t(^\\circ\\text{C}) + 273 = 37 + 273 = 310\\text{ K}$.'],
  ['dr-li-5', 'Vật lí', 'Định luật I Nhiệt động lực học', 'TB', 'Một khối khí nhận nhiệt lượng $Q = 150\\text{ J}$ và thực hiện công $A\' = 90\\text{ J}$ đẩy pít-tông. Độ biến thiên nội năng $\\Delta U$ của khối khí là:', ['$+60\\text{ J}$', '$+240\\text{ J}$', '$-60\\text{ J}$', '$-240\\text{ J}$'], 'A', 'Theo quy ước dấu: nhận nhiệt $Q = +150\\text{ J}$, sinh công $A = -90\\text{ J} \\Rightarrow \\Delta U = Q + A = 60\\text{ J}$.'],
  ['dr-li-6', 'Vật lí', 'Nhiệt dung riêng', 'TB', 'Nhiệt lượng cần thiết để đun nóng $2\\text{ kg}$ nước từ $20^\\circ\\text{C}$ lên $100^\\circ\\text{C}$ (biết $c = 4200\\text{ J/(kg}\\cdot\\text{K)}$) là:', ['$672\\text{ kJ}$', '$336\\text{ kJ}$', '$840\\text{ kJ}$', '$168\\text{ kJ}$'], 'A', '$Q = mc\\Delta t = 2 \\times 4200 \\times 80 = 672000\\text{ J} = 672\\text{ kJ}$.'],
  ['dr-li-7', 'Vật lí', 'Nhiệt hóa hơi riêng', 'TB', 'Biết nhiệt hóa hơi riêng của nước ở $100^\\circ\\text{C}$ là $L = 2{,}26\\times 10^6\\text{ J/kg}$. Nhiệt lượng cần để làm hóa hơi hoàn toàn $0{,}5\\text{ kg}$ nước đang sôi ở $100^\\circ\\text{C}$ là:', ['$1{,}13\\text{ MJ}$', '$2{,}26\\text{ MJ}$', '$4{,}52\\text{ MJ}$', '$0{,}565\\text{ MJ}$'], 'A', '$Q = Lm = 2,26\\times 10^6 \\times 0,5 = 1,13\\times 10^6\\text{ J} = 1,13\\text{ MJ}$.'],
  ['dr-li-8', 'Vật lí', 'Định luật Boyle (Đẳng nhiệt)', 'Dễ', 'Nén đẳng nhiệt một lượng khí lí tưởng từ thể tích $6\\text{ lít}$ xuống còn $2\\text{ lít}$ thì áp suất của khí:', ['Tăng gấp 3 lần', 'Giảm đi 3 lần', 'Không thay đổi', 'Tăng gấp 9 lần'], 'A', 'Định luật Boyle: $p_1 V_1 = p_2 V_2 \\Rightarrow p_2 = p_1 \\frac{6}{2} = 3p_1$.'],
  ['dr-li-9', 'Vật lí', 'Định luật Charles (Đẳng áp)', 'TB', 'Trong quá trình đẳng áp của một lượng khí lí tưởng, khi nhiệt độ tuyệt đối $T$ tăng gấp đôi thì thể tích $V$ của khối khí:', ['Tăng gấp đôi', 'Giảm một nửa', 'Tăng gấp 4 lần', 'Không đổi'], 'A', 'Định luật Charles: $\\frac{V}{T} = \\text{const} \\Rightarrow V$ tỉ lệ thuận với $T$.'],
  ['dr-li-10', 'Vật lí', 'Phương trình trạng thái khí lí tưởng', 'Khó', 'Một bình kín chứa $2\\text{ mol}$ khí lí tưởng ở nhiệt độ $300\\text{ K}$ và thể tích $8{,}31\\text{ lít}$. Lấy $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$. Áp suất khí trong bình là:', ['$6\\times 10^5\\text{ Pa}$', '$3\\times 10^5\\text{ Pa}$', '$600\\text{ Pa}$', '$1{,}2\\times 10^6\\text{ Pa}$'], 'A', '$p = \\frac{nRT}{V} = \\frac{2 \\times 8,31 \\times 300}{8,31 \\times 10^{-3}} = 6\\times 10^5\\text{ Pa}$.'],
  ['dr-li-11', 'Vật lí', 'Động năng phân tử khí', 'TB', 'Động năng tịnh tiến trung bình của phân tử khí lí tưởng ở nhiệt độ tuyệt đối $T$ được xác định bởi hệ thức:', ['$\\overline{E}_đ = \\frac{3}{2} k T$', '$\\overline{E}_đ = \\frac{1}{2} k T$', '$\\overline{E}_đ = 3 k T$', '$\\overline{E}_đ = \\frac{2}{3} k T$'], 'A', 'Động năng trung bình của phân tử khí đơn nguyên tử tỉ lệ thuận với nhiệt độ tuyệt đối: $\\overline{E}_đ = \\frac{3}{2}kT$.'],
  ['dr-li-12', 'Vật lí', 'Lực từ tác dụng lên đoạn dây dẫn', 'Dễ', 'Đoạn dây dẫn dài $l = 0{,}5\\text{ m}$ mang dòng điện $I = 4\\text{ A}$ đặt vuông góc với các đường sức của từ trường đều $B = 0{,}2\\text{ T}$. Độ lớn lực từ tác dụng lên đoạn dây là:', ['$0{,}4\\text{ N}$', '$0{,}2\\text{ N}$', '$0{,}8\\text{ N}$', '$4{,}0\\text{ N}$'], 'A', '$F = BIl\\sin 90^\\circ = 0,2 \\times 4 \\times 0,5 \\times 1 = 0,4\\text{ N}$.'],
  ['dr-li-13', 'Vật lí', 'Quy tắc bàn tay trái', 'Dễ', 'Khi dây dẫn mang dòng điện đặt song song với các đường sức từ ($\\alpha = 0^\\circ$ hoặc $180^\\circ$) thì lực từ tác dụng lên dây dẫn có độ lớn:', ['Bằng $0$', 'Cực đại $F = BIl$', 'Bằng $\\frac{1}{2}BIl$', 'Tăng gấp đôi'], 'A', 'Vì $\\sin 0^\\circ = \\sin 180^\\circ = 0$ nên $F = BIl\\sin\\alpha = 0$.'],
  ['dr-li-14', 'Vật lí', 'Từ thông', 'TB', 'Một khung dây phẳng diện tích $S = 20\\text{ cm}^2$ gồm $N = 100$ vòng đặt trong từ trường đều $B = 0{,}1\\text{ T}$. Vectơ pháp tuyến khung dây hợp với $\\vec{B}$ góc $60^\\circ$. Từ thông qua khung dây là:', ['$0{,}01\\text{ Wb}$', '$0{,}02\\text{ Wb}$', '$0{,}1\\text{ Wb}$', '$100\\text{ Wb}$'], 'A', '$\\Phi = NBS\\cos 60^\\circ = 100 \\times 0,1 \\times (20\\times 10^{-4}) \\times 0,5 = 0,01\\text{ Wb}$.'],
  ['dr-li-15', 'Vật lí', 'Định luật Lenz', 'Dễ', 'Định luật Lenz dùng để xác định:', ['Chiều của dòng điện cảm ứng xuất hiện trong mạch kín', 'Độ lớn của lực từ tác dụng lên dây dẫn', 'Tần số của sóng điện từ', 'Chu kì bán rã của chất phóng xạ'], 'A', 'Định luật Lenz khẳng định dòng điện cảm ứng có chiều chống lại nguyên nhân sinh ra nó.'],
  ['dr-li-16', 'Vật lí', 'Dòng điện xoay chiều', 'Dễ', 'Dòng điện xoay chiều có biểu thức $i = 4\\sqrt{2}\\cos(100\\pi t)\\text{ (A)}$. Cường độ dòng điện hiệu dụng $I$ và tần số $f$ của dòng điện là:', ['$I = 4\\text{ A},\\; f = 50\\text{ Hz}$', '$I = 4\\sqrt{2}\\text{ A},\\; f = 50\\text{ Hz}$', '$I = 4\\text{ A},\\; f = 100\\text{ Hz}$', '$I = 2\\sqrt{2}\\text{ A},\\; f = 50\\text{ Hz}$'], 'A', '$I = \\frac{I_0}{\\sqrt{2}} = 4\\text{ A}$, $f = \\frac{\\omega}{2\\pi} = \\frac{100\\pi}{2\\pi} = 50\\text{ Hz}$.'],
  ['dr-li-17', 'Vật lí', 'Máy biến áp lí tưởng', 'TB', 'Một máy biến áp lí tưởng có số vòng cuộn sơ cấp $N_1 = 1000$ vòng, cuộn thứ cấp $N_2 = 200$ vòng. Nối sơ cấp với điện áp hiệu dụng $U_1 = 220\\text{ V}$ thì điện áp hiệu dụng thứ cấp để hở $U_2$ là:', ['$44\\text{ V}$', '$1100\\text{ V}$', '$110\\text{ V}$', '$22\\text{ V}$'], 'A', '$\\frac{U_2}{U_1} = \\frac{N_2}{N_1} \\Rightarrow U_2 = 220 \\times \\frac{200}{1000} = 44\\text{ V}$.'],
  ['dr-li-18', 'Vật lí', 'Truyền tải điện năng', 'Khó', 'Khi truyền tải một công suất điện xác định đi xa trên đường dây có điện trở $R$, nếu tăng điện áp hiệu dụng nơi truyền đi lên $10$ lần thì công suất hao phí do tỏa nhiệt trên dây sẽ:', ['Giảm đi $100$ lần', 'Giảm đi $10$ lần', 'Tăng lên $10$ lần', 'Tăng lên $100$ lần'], 'A', '$\\Delta P = \\frac{P^2 R}{U^2\\cos^2\\varphi} \\Rightarrow$ tỉ lệ nghịch với $U^2$, nên $U$ tăng 10 lần thì $\\Delta P$ giảm $10^2 = 100$ lần.'],
  ['dr-li-19', 'Vật lí', 'Sóng điện từ', 'Dễ', 'Trong sóng điện từ lan truyền trong chân không, vectơ cường độ điện trường $\\vec{E}$ và vectơ cảm ứng từ $\\vec{B}$ tại một điểm luôn:', ['Dao động cùng pha và có phương vuông góc với nhau', 'Dao động ngược pha và cùng phương', 'Dao động vuông pha với nhau', 'Cùng phương với phương truyền sóng'], 'A', 'Sóng điện từ là sóng ngang: $\\vec{E}, \\vec{B}, \\vec{v}$ tạo tam diện thuận và $\\vec{E}, \\vec{B}$ dao động cùng pha.'],
  ['dr-li-20', 'Vật lí', 'Bước sóng sóng điện từ', 'TB', 'Một đài phát thanh FM phát sóng điện từ ở tần số $f = 100\\text{ MHz}$. Lấy tốc độ ánh sáng $c = 3\\times 10^8\\text{ m/s}$. Bước sóng của sóng này là:', ['$3{,}0\\text{ m}$', '$30\\text{ m}$', '$0{,}3\\text{ m}$', '$300\\text{ m}$'], 'A', '$\\lambda = \\frac{c}{f} = \\frac{3\\times 10^8}{100\\times 10^6} = 3,0\\text{ m}$.'],
  ['dr-li-21', 'Vật lí', 'Cấu tạo hạt nhân nguyên tử', 'Dễ', 'Hạt nhân Uranium $^{235}_{92}\\text{U}$ có số proton ($Z$) và số neutron ($N$) lần lượt là:', ['$92$ proton và $143$ neutron', '$92$ proton và $235$ neutron', '$143$ proton và $92$ neutron', '$235$ proton và $92$ neutron'], 'A', '$Z = 92$, số neutron $N = A - Z = 235 - 92 = 143$.'],
  ['dr-li-22', 'Vật lí', 'Hệ thức Einstein', 'TB', 'Biết $1\\text{ amu} \\approx 931{,}5\\text{ MeV}/c^2$. Một hạt nhân có độ hụt khối $\\Delta m = 0{,}03\\text{ amu}$ thì năng lượng liên kết của nó bằng:', ['$27{,}945\\text{ MeV}$', '$31{,}05\\text{ MeV}$', '$931{,}5\\text{ MeV}$', '$9{,}315\\text{ MeV}$'], 'A', '$W_{\\text{lk}} = \\Delta m \\cdot c^2 = 0,03 \\times 931,5 = 27,945\\text{ MeV}$.'],
  ['dr-li-23', 'Vật lí', 'Độ bền vững hạt nhân', 'TB', 'Đại lượng đặc trưng cho mức độ bền vững của một hạt nhân nguyên tử là:', ['Năng lượng liên kết riêng ($W_{\\text{lk}}/A$)', 'Số khối $A$', 'Độ hụt khối $\\Delta m$', 'Số điện tích $Z$'], 'A', 'Hạt nhân có năng lượng liên kết riêng ($\\varepsilon = W_{\\text{lk}}/A$) càng lớn thì càng bền vững (lớn nhất ở $50 < A < 80$).'],
  ['dr-li-24', 'Vật lí', 'Phóng xạ hạt nhân', 'Dễ', 'Tia phóng xạ nào sau đây là dòng các hạt nhân nguyên tử Helium ($^4_2\\text{He}$)?', ['Tia $\\alpha$', 'Tia $\\beta^-$', 'Tia $\\beta^+$', 'Tia $\\gamma$'], 'A', 'Tia alpha ($\\alpha$) là dòng các hạt nhân $^4_2\\text{He}$ chuyển động với tốc độ khoảng $2\\times 10^7\\text{ m/s}$.'],
  ['dr-li-25', 'Vật lí', 'Định luật phóng xạ (Chu kì bán rã)', 'TB', 'Chất phóng xạ Iodine $^{131}\\text{I}$ có chu kì bán rã $T = 8$ ngày. Ban đầu có $100\\text{ gam}$ $^{131}\\text{I}$, sau $24$ ngày khối lượng $^{131}\\text{I}$ còn lại là:', ['$12{,}5\\text{ gam}$', '$25{,}0\\text{ gam}$', '$33{,}3\\text{ gam}$', '$6{,}25\\text{ gam}$'], 'A', '$t = 24\\text{ ngày} = 3T \\Rightarrow m = m_0 \\cdot 2^{-t/T} = 100 \\cdot 2^{-3} = 12,5\\text{ g}$.'],
  ['dr-li-26', 'Vật lí', 'Phản ứng Nhiệt hạch & Phân hạch', 'TB', 'Nguồn năng lượng khổng lồ của Mặt Trời và các ngôi sao được sinh ra chủ yếu từ:', ['Phản ứng nhiệt hạch (tổng hợp các hạt nhân nhẹ thành Helium)', 'Phản ứng phân hạch Uranium-235', 'Sự đốt cháy khí Hydrogen với Oxygen', 'Phóng xạ tự nhiên của Radium'], 'A', 'Trong lòng Mặt Trời diễn ra phản ứng nhiệt hạch tổng hợp Hydrogen thành Helium ở nhiệt độ hàng chục triệu độ.'],
  ['dr-li-27', 'Vật lí', 'Dao động điều hòa', 'Dễ', 'Một vật dao động điều hòa theo phương trình $x = 6\\cos(4\\pi t + \\frac{\\pi}{3})\\text{ (cm)}$. Biên độ và chu kì dao động của vật là:', ['$A = 6\\text{ cm},\\; T = 0{,}5\\text{ s}$', '$A = 6\\text{ cm},\\; T = 2\\text{ s}$', '$A = 3\\text{ cm},\\; T = 0{,}5\\text{ s}$', '$A = 12\\text{ cm},\\; T = 0{,}5\\text{ s}$'], 'A', '$A = 6\\text{ cm}$, $T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi}{4\\pi} = 0,5\\text{ s}$.'],
  ['dr-li-28', 'Vật lí', 'Vận tốc & Gia tốc dao động điều hòa', 'TB', 'Khi chất điểm dao động điều hòa đi qua vị trí cân bằng ($x = 0$) thì:', ['Tốc độ đạt cực đại, gia tốc bằng $0$', 'Tốc độ bằng $0$, gia tốc đạt cực đại', 'Cả tốc độ và gia tốc đều cực đại', 'Thế năng đạt cực đại'], 'A', 'Tại VTCB $x = 0 \\Rightarrow |a| = \\omega^2|x| = 0$ và $|v|_{\\max} = \\omega A$.'],
  ['dr-li-29', 'Vật lí', 'Con lắc lò xo', 'TB', 'Con lắc lò xo gồm vật nặng $m = 100\\text{ g}$ và lò xo có độ cứng $k = 40\\text{ N/m}$. Tần số góc $\\omega$ của con lắc là:', ['$20\\text{ rad/s}$', '$2\\text{ rad/s}$', '$400\\text{ rad/s}$', '$10\\text{ rad/s}$'], 'A', '$\\omega = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{40}{0,1}} = \\sqrt{400} = 20\\text{ rad/s}$.'],
  ['dr-li-30', 'Vật lí', 'Con lắc đơn', 'TB', 'Tại nơi có gia tốc trọng trường $g = \\pi^2 \\approx 9{,}87\\text{ m/s}^2$, con lắc đơn có chiều dài $l = 1\\text{ m}$ dao động điều hòa với chu kì bằng:', ['$2{,}0\\text{ s}$', '$1{,}0\\text{ s}$', '$0{,}5\\text{ s}$', '$4{,}0\\text{ s}$'], 'A', '$T = 2\\pi\\sqrt{\\frac{l}{g}} = 2\\pi\\sqrt{\\frac{1}{\\pi^2}} = 2,0\\text{ s}$.'],
  ['dr-li-31', 'Vật lí', 'Sóng cơ học', 'Dễ', 'Một sóng cơ có tần số $f = 20\\text{ Hz}$ truyền trên mặt nước với tốc độ $v = 1{,}6\\text{ m/s}$. Bước sóng $\\lambda$ bằng:', ['$8\\text{ cm}$', '$32\\text{ cm}$', '$12{,}5\\text{ cm}$', '$0{,}8\\text{ cm}$'], 'A', '$\\lambda = \\frac{v}{f} = \\frac{1,6}{20} = 0,08\\text{ m} = 8\\text{ cm}$.'],
  ['dr-li-32', 'Vật lí', 'Giao thoa sóng cơ', 'TB', 'Trong thí nghiệm giao thoa sóng mặt nước với hai nguồn kết hợp cùng pha $S_1, S_2$, những điểm cực đại giao thoa có hiệu đường đi đến hai nguồn thỏa mãn:', ['$d_2 - d_1 = k\\lambda\\;(k \\in \\mathbb{Z})$', '$d_2 - d_1 = (k + 0{,}5)\\lambda$', '$d_2 - d_1 = (2k + 1)\\lambda$', '$d_2 + d_1 = k\\lambda$'], 'A', 'Hai nguồn cùng pha thì cực đại giao thoa khi hiệu đường đi bằng một số nguyên lần bước sóng.'],
  ['dr-li-33', 'Vật lí', 'Sóng dừng trên dây', 'TB', 'Trên một sợi dây đàn hồi có sóng dừng, khoảng cách giữa hai nút sóng liên tiếp (hoặc hai bụng sóng liên tiếp) bằng:', ['$\\frac{\\lambda}{2}$', '$\\lambda$', '$\\frac{\\lambda}{4}$', '$2\\lambda$'], 'A', 'Trong sóng dừng, hai nút hoặc hai bụng liên tiếp cách nhau nửa bước sóng ($\\lambda/2$).'],
  ['dr-li-34', 'Vật lí', 'Giao thoa ánh sáng Young', 'TB', 'Trong thí nghiệm Young về giao thoa ánh sáng với $a = 1\\text{ mm}, D = 2\\text{ m}, \\lambda = 0{,}5\\text{ }\\mu\\text{m}$, khoảng vân $i$ trên màn quan sát là:', ['$1{,}0\\text{ mm}$', '$0{,}5\\text{ mm}$', '$2{,}0\\text{ mm}$', '$1{,}5\\text{ mm}$'], 'A', '$i = \\frac{\\lambda D}{a} = \\frac{0,5 \\times 2}{1} = 1,0\\text{ mm}$.'],
  ['dr-li-35', 'Vật lí', 'Định luật Ohm cho toàn mạch', 'TB', 'Một nguồn điện có suất điện động $\\mathcal{E} = 12\\text{ V}$, điện trở trong $r = 1\\text{ }\\Omega$ nối với điện trở mạch ngoài $R = 5\\text{ }\\Omega$ thành mạch kín. Cường độ dòng điện trong mạch là:', ['$2{,}0\\text{ A}$', '$2{,}4\\text{ A}$', '$12\\text{ A}$', '$1{,}5\\text{ A}$'], 'A', '$I = \\frac{\\mathcal{E}}{R + r} = \\frac{12}{5 + 1} = 2,0\\text{ A}$.'],
  ['dr-li-36', 'Vật lí', 'Công suất điện', 'Dễ', 'Bóng đèn ghi $220\\text{ V} - 110\\text{ W}$ khi sáng bình thường ở hiệu điện thế $220\\text{ V}$ có dòng điện chạy qua là:', ['$0{,}5\\text{ A}$', '$2{,}0\\text{ A}$', '$1{,}0\\text{ A}$', '$0{,}25\\text{ A}$'], 'A', '$I = \\frac{P}{U} = \\frac{110}{220} = 0,5\\text{ A}$.'],
  ['dr-li-37', 'Vật lí', 'Định luật Coulomb', 'Dễ', 'Khi khoảng cách giữa hai điện tích điểm trong chân không tăng lên gấp $2$ lần thì độ lớn lực tương tác tĩnh điện giữa chúng:', ['Giảm đi $4$ lần', 'Giảm đi $2$ lần', 'Tăng lên $2$ lần', 'Tăng lên $4$ lần'], 'A', '$F = k\\frac{|q_1 q_2|}{r^2}$ tỉ lệ nghịch với bình phương khoảng cách $r^2$.'],
  ['dr-li-38', 'Vật lí', 'Tụ điện', 'Dễ', 'Một tụ điện có điện dung $C = 20\\text{ }\\mu\\text{F}$ được tích điện dưới hiệu điện thế $U = 50\\text{ V}$. Điện tích của tụ điện là:', ['$10^{-3}\\text{ C}$ ($1\\text{ mC}$)', '$2{,}5\\text{ C}$', '$1000\\text{ C}$', '$4\\times 10^{-7}\\text{ C}$'], 'A', '$Q = CU = 20\\times 10^{-6} \\times 50 = 10^{-3}\\text{ C}$.'],
  ['dr-li-39', 'Vật lí', 'Cân bằng nhiệt', 'Khó', 'Thả một miếng đồng khối lượng $0{,}5\\text{ kg}$ ở $100^\\circ\\text{C}$ ($c_1 = 380\\text{ J/(kg}\\cdot\\text{K)}$) vào $0{,}5\\text{ kg}$ nước ở $20^\\circ\\text{C}$ ($c_2 = 4200\\text{ J/(kg}\\cdot\\text{K)}$). Bỏ qua hao phí, nhiệt độ khi cân bằng nhiệt gần nhất với:', ['$26{,}6^\\circ\\text{C}$', '$60{,}0^\\circ\\text{C}$', '$35{,}2^\\circ\\text{C}$', '$22{,}4^\\circ\\text{C}$'], 'A', '$m_1 c_1(100 - t) = m_2 c_2(t - 20) \\Rightarrow 380(100 - t) = 4200(t - 20) \\Rightarrow t \\approx 26,6^\\circ\\text{C}$.'],
  ['dr-li-40', 'Vật lí', 'Khối lượng riêng chất khí', 'Khó', 'Ở điều kiện tiêu chuẩn ($0^\\circ\\text{C}, 1\\text{ atm}$), khối lượng riêng của khí Oxygen ($\\text{O}_2, M=32$) là $\\rho_0$. Khi nung nóng đẳng áp lên $273^\\circ\\text{C}$ thì khối lượng riêng của khí là:', ['$\\frac{\\rho_0}{2}$', '$2\\rho_0$', '$\\rho_0$', '$\\frac{\\rho_0}{4}$'], 'A', '$T_1 = 273\\text{ K}, T_2 = 546\\text{ K} = 2T_1$. Đẳng áp thì $V$ tăng gấp đôi nên khối lượng riêng $\\rho = m/V$ giảm một nửa.'],
  ['dr-li-41', 'Vật lí', 'Thanh dẫn chuyển động trong từ trường', 'Khó', 'Thanh dẫn điện dài $l = 0{,}4\\text{ m}$ chuyển động thẳng đều với vận tốc $v = 5\\text{ m/s}$ vuông góc với các đường sức từ của từ trường đều $B = 0{,}5\\text{ T}$. Suất điện động cảm ứng xuất hiện trong thanh là:', ['$1{,}0\\text{ V}$', '$2{,}0\\text{ V}$', '$0{,}1\\text{ V}$', '$4{,}0\\text{ V}$'], 'A', '$|e_c| = Blv\\sin 90^\\circ = 0,5 \\times 0,4 \\times 5 = 1,0\\text{ V}$.'],
  ['dr-li-42', 'Vật lí', 'Lực Lorentz', 'TB', 'Một hạt mang điện tích $q$ bay vào từ trường đều $\\vec{B}$ với vận tốc $\\vec{v} \\perp \\vec{B}$ thì quỹ đạo chuyển động của hạt là:', ['Một đường tròn nằm trong mặt phẳng vuông góc với $\\vec{B}$', 'Một đường thẳng song song với $\\vec{B}$', 'Một nhánh parabol', 'Một đường xoắn ốc bất kì'], 'A', 'Lực Lorentz đóng vai trò lực hướng tâm giữ hạt chuyển động tròn đều trong mặt phẳng vuông góc với $\\vec{B}$.'],
  ['dr-li-43', 'Vật lí', 'Định luật bảo toàn trong phản ứng hạt nhân', 'TB', 'Cho phản ứng hạt nhân: $^{27}_{13}\\text{Al} + ^4_2\\text{He} \\to ^{30}_{15}\\text{P} + X$. Hạt $X$ là:', ['Neutron ($^1_0 n$)', 'Proton ($^1_1 p$)', 'Electron ($^0_{-1} e$)', 'Positron ($^0_{+1} e$)'], 'A', 'Bảo toàn số khối: $27 + 4 = 30 + A \\Rightarrow A = 1$; bảo toàn điện tích: $13 + 2 = 15 + Z \\Rightarrow Z = 0 \\Rightarrow ^1_0 n$.'],
  ['dr-li-44', 'Vật lí', 'Độ phóng xạ', 'Siêu khó', 'Một mẫu chất phóng xạ có chu kì bán rã $T = 138$ ngày (Polonium $^{210}\\text{Po}$). Sau bao nhiêu ngày thì độ phóng xạ của mẫu giảm đi $87{,}5\\%$ so với ban đầu?', ['$414$ ngày', '$276$ ngày', '$552$ ngày', '$138$ ngày'], 'A', 'Giảm $87,5\\%$ tức là còn lại $12,5\\% = \\frac{1}{8} = 2^{-3} \\Rightarrow t = 3T = 3 \\times 138 = 414$ ngày.'],
  ['dr-li-45', 'Vật lí', 'Chụp cộng hưởng từ MRI', 'Dễ', 'Kĩ thuật chụp cộng hưởng từ hạt nhân (MRI) trong y học chẩn đoán hình ảnh dựa trên nguyên lí vật lí nào?', ['Hiện tượng cộng hưởng từ của hạt nhân Hydrogen trong từ trường mạnh và sóng vô tuyến', 'Sự đâm xuyên mạnh của tia X qua xương', 'Sự phản xạ của sóng siêu âm tần số cao', 'Sự phóng xạ tia gamma từ đồng vị tiêm vào máu'], 'A', 'Máy MRI sử dụng từ trường mạnh và xung sóng radio kích thích cộng hưởng từ các proton (Hydrogen) trong cơ thể, hoàn toàn không dùng tia xạ ion hóa.'],

  // ==================== SINH HỌC (45 CÂU) ====================
  ['dr-sinh-1', 'Sinh học', 'Vật chất di truyền & Nhân đôi ADN', 'Dễ', 'Trong quá trình nhân đôi ADN, enzyme xúc tác nối các đoạn Okazaki lại với nhau là:', ['DNA ligase', 'DNA polymerase', 'RNA polymerase', 'Helicase'], 'A', 'DNA ligase xúc tác hình thành liên kết phosphodiester nối các đoạn Okazaki trên mạch tổng hợp gián đoạn.'],
  ['dr-sinh-2', 'Sinh học', 'Quy luật Menđen & Di truyền học', 'TB', 'Phép lai $AaBb \\times AaBb$ (các gen trội hoàn toàn, phân li độc lập) cho tối đa bao nhiêu loại kiểu hình ở đời con $F_1$?', ['$4$', '$9$', '$2$', '$8$'], 'A', 'Mỗi cặp dị hợp cho 2 kiểu hình $\\Rightarrow 2 \\times 2 = 4$ loại kiểu hình (tỉ lệ 9:3:3:1).'],
  ['dr-sinh-3', 'Sinh học', 'Cấu trúc DNA (Chargaff)', 'TB', 'Một phân tử DNA mạch kép có tỉ lệ nucleotide loại Adenine ($A$) chiếm $20\\%$ tổng số nucleotide. Tỉ lệ nucleotide loại Guanine ($G$) của DNA này là:', ['$30\\%$', '$20\\%$', '$40\\%$', '$60\\%$'], 'A', 'Theo nguyên tắc bổ sung $A + G = 50\\% \\Rightarrow G = 50\\% - 20\\% = 30\\%$.'],
  ['dr-sinh-4', 'Sinh học', 'Phiên mã & Dịch mã', 'Dễ', 'Bào quan trực tiếp thực hiện quá trình dịch mã tổng hợp chuỗi polypeptide từ phân tử mRNA là:', ['Ribosome', 'Lưới nội chất trơn', 'Bộ máy Golgi', 'Ti thể'], 'A', 'Ribosome trượt trên mRNA theo chiều $5\' \\to 3\'$ để dịch các bộ ba mã sao thành chuỗi amino acid.'],
  ['dr-sinh-5', 'Sinh học', 'Mã di truyền', 'Dễ', 'Trên phân tử mRNA, bộ ba mở đầu quá trình dịch mã ở sinh vật nhân thực là:', ['$5\'\\text{AUG}3\'$ (mã hóa Methionine)', '$5\'\\text{UAA}3\'$', '$5\'\\text{UGA}3\'$', '$5\'\\text{UAG}3\'$'], 'A', '$5\'\\text{AUG}3\'$ là codon mở đầu; UAA, UAG, UGA là 3 bộ ba kết thúc.'],
  ['dr-sinh-6', 'Sinh học', 'Điều hòa hoạt động gen (Operon Lac)', 'TB', 'Trong mô hình Operon Lac ở vi khuẩn E. coli, khi môi trường có đường lactose thì lactose đóng vai trò là:', ['Chất cảm ứng làm bất hoạt protein ức chế', 'Chất đồng ức chế gắn vào vùng khởi động P', 'Enzyme phân giải trực tiếp glucose', 'Nơi bám của enzyme RNA polymerase'], 'A', 'Allolactose (đồng phân của lactose) liên kết làm biến đổi cấu hình protein ức chế, giúp giải phóng vùng vận hành O để phiên mã.'],
  ['dr-sinh-7', 'Sinh học', 'Đột biến gen', 'TB', 'Dạng đột biến điểm nào sau đây làm thay đổi toàn bộ các bộ ba từ vị trí đột biến đến cuối gen (đột biến dịch khung)?', ['Mất hoặc thêm 1 cặp nucleotide', 'Thay thế 1 cặp $A-T$ bằng 1 cặp $G-C$', 'Thay thế 1 cặp $G-C$ bằng 1 cặp $C-G$', 'Đột biến đồng nghĩa'], 'A', 'Mất hoặc thêm 1 cặp nucleotide làm dịch khung đọc mã di truyền từ điểm đột biến trở về sau.'],
  ['dr-sinh-8', 'Sinh học', 'Cấu trúc siêu hiển vi NST', 'Dễ', 'Đơn vị cấu trúc cơ bản của nhiễm sắc thể ở sinh vật nhân thực gồm một đoạn DNA quấn quanh khối 8 phân tử protein histone được gọi là:', ['Nucleosome', 'Chromatid', 'Centromere (Tâm động)', 'Plasmid'], 'A', 'Mỗi nucleosome gồm 8 phân tử histone được quấn quanh bởi $1\\frac{3}{4}$ vòng DNA (146 cặp nucleotide).'],
  ['dr-sinh-9', 'Sinh học', 'Đột biến cấu trúc NST', 'TB', 'Để làm tăng hoạt tính của enzyme amylase ở đại mạch phục vụ công nghiệp sản xuất bia, người ta ứng dụng dạng đột biến cấu trúc NST nào?', ['Lặp đoạn NST', 'Mất đoạn NST', 'Đảo đoạn NST', 'Chuyển đoạn không tương hỗ'], 'A', 'Đột biến lặp đoạn làm tăng số lượng bản sao của gen quy định enzyme amylase.'],
  ['dr-sinh-10', 'Sinh học', 'Đột biến lệch bội', 'Dễ', 'Hội chứng Down ở người là dạng đột biến lệch bội thuộc thể ba ở cặp nhiễm sắc thể số mấy?', ['Cặp NST số 21 (có 3 NST số 21)', 'Cặp NST số 18', 'Cặp NST số 13', 'Cặp NST giới tính XXY'], 'A', 'Người mắc hội chứng Down có bộ NST $2n + 1 = 47$ với 3 NST ở cặp số 21.'],
  ['dr-sinh-11', 'Sinh học', 'Đột biến đa bội', 'TB', 'Đặc điểm nổi bật của thể đa bội lẻ (như dưa hấu tam bội $3n$) trong trồng trọt là:', ['Quả to, ngọt và thường không có hạt', 'Có nhiều hạt to để làm giống', 'Sinh sản hữu tính rất mạnh', 'Cây còi cọc và lá nhỏ hơn cây $2n$'], 'A', 'Thể đa bội lẻ ($3n, 5n$) bị rối loạn giảm phân không tạo được giao tử bình thường nên cho quả không hạt.'],
  ['dr-sinh-12', 'Sinh học', 'Phép lai phân tích', 'Dễ', 'Lai phân tích là phép lai giữa cá thể mang tính trạng trội cần xác định kiểu gen với cá thể:', ['Mang tính trạng lặn tương ứng ($aa$)', 'Cùng kiểu hình trội ($AA$ hoặc $Aa$)', 'Dị hợp tử tất cả các cặp gen', 'Bố hoặc mẹ thuần chủng trội'], 'A', 'Lai phân tích (lai với đồng hợp lặn) giúp kiểm tra cá thể trội là thuần chủng ($AA$) hay dị hợp ($Aa$).'],
  ['dr-sinh-13', 'Sinh học', 'Tương tác gen bổ sung', 'Khó', 'Ở đậu thơm, sự có mặt của cả hai alen trội $A$ và $B$ quy định hoa đỏ, các kiểu gen còn lại quy định hoa trắng. Phép lai $AaBb \\times AaBb$ cho tỉ lệ kiểu hình ở $F_1$ là:', ['$9$ hoa đỏ : $7$ hoa trắng', '$9 : 6 : 1$', '$13 : 3$', '$15 : 1$'], 'A', '$A-B-$ chiếm $9/16$ (đỏ); $A-bb + aaB- + aabb = 3/16 + 3/16 + 1/16 = 7/16$ (trắng).'],
  ['dr-sinh-14', 'Sinh học', 'Liên kết gen & Hoán vị gen (Morgan)', 'TB', 'Đối tượng thí nghiệm giúp T.H. Morgan phát hiện ra quy luật liên kết gen, hoán vị gen và di truyền liên kết giới tính là:', ['Ruồi giấm (Drosophila melanogaster)', 'Đậu Hà Lan (Pisum sativum)', 'Hoa phấn (Mirabilis jalapa)', 'Vi khuẩn E. coli'], 'A', 'Ruồi giấm có bộ NST ít ($2n = 8$), vòng đời ngắn, đẻ nhiều và nhiều biến dị dễ quan sát.'],
  ['dr-sinh-15', 'Sinh học', 'Tần số hoán vị gen', 'TB', 'Tần số hoán vị gen ($f$) giữa hai gen trên cùng một nhiễm sắc thể không bao giờ vượt quá:', ['$50\\%$', '$25\\%$', '$75\\%$', '$100\\%$'], 'A', 'Ngay cả khi 100% tế bào xảy ra trao đổi chéo giữa 2 trong 4 chromatid thì tối đa cũng chỉ tạo 50% giao tử hoán vị.'],
  ['dr-sinh-16', 'Sinh học', 'Tính giao tử hoán vị gen', 'Khó', 'Cơ thể có kiểu gen $\\frac{AB}{ab}$ giảm phân có hoán vị gen với tần số $f = 20\\%$ sẽ tạo ra loại giao tử liên kết $\\underline{AB}$ với tỉ lệ:', ['$40\\%$', '$10\\%$', '$20\\%$', '$30\\%$'], 'A', 'Giao tử liên kết: $\\underline{AB} = \\underline{ab} = \\frac{100\\% - f}{2} = \\frac{100\\% - 20\\%}{2} = 40\\%$.'],
  ['dr-sinh-17', 'Sinh học', 'Di truyền liên kết giới tính', 'TB', 'Ở người, bệnh mù màu đỏ – lục và bệnh máu khó đông do gen lặn nằm trên vùng không tương đồng của NST giới tính $X$ quy định. Quy luật di truyền đặc trưng của bệnh này là:', ['Di truyền chéo và gặp ở nam giới nhiều hơn nữ giới', 'Chỉ truyền thẳng từ bố cho 100% con trai', 'Luôn biểu hiện 100% ở đời con như di truyền tế bào chất', 'Tỉ lệ mắc bệnh ở nam và nữ luôn bằng nhau'], 'A', 'Nam giới ($XY$) chỉ cần 1 alen lặn $X^aY$ đã biểu hiện bệnh, trong khi nữ giới cần $X^aX^a$.'],
  ['dr-sinh-18', 'Sinh học', 'Di truyền ngoài nhân (Correns)', 'Dễ', 'Khi lai thuận và lai nghịch ở cây hoa phấn mà kết quả đời con luôn có kiểu hình giống cây mẹ thì tính trạng đó do:', ['Gen nằm trong tế bào chất (ti thể hoặc lục lạp) quy định', 'Gen nằm trên NST thường quy định', 'Gen nằm trên NST giới tính Y quy định', 'Tương tác cộng gộp quy định'], 'A', 'Tế bào chất của hợp tử chủ yếu nhận từ giao tử cái (trứng) nên đời con di truyền theo dòng mẹ.'],
  ['dr-sinh-19', 'Sinh học', 'Mức phản ứng & Thường biến', 'TB', 'Hiện tượng cây hoa cẩm tú cầu có cùng kiểu gen nhưng trồng ở đất có độ pH khác nhau cho màu hoa khác nhau (xanh, tím, đỏ) là ví dụ về:', ['Thường biến (sự mềm dẻo kiểu hình)', 'Đột biến đa bội', 'Đột biến gen trội', 'Hoán vị gen'], 'A', 'Thường biến là những biến đổi kiểu hình của cùng một kiểu gen phát sinh trong đời cá thể dưới ảnh hưởng của môi trường, không di truyền.'],
  ['dr-sinh-20', 'Sinh học', 'Di truyền quần thể (Hardy-Weinberg)', 'TB', 'Một quần thể ngẫu phối đạt trạng thái cân bằng di truyền có tần số alen $A = 0{,}6$ và $a = 0{,}4$. Tần số kiểu gen dị hợp $Aa$ trong quần thể là:', ['$0{,}48$', '$0{,}36$', '$0{,}16$', '$0{,}24$'], 'A', 'Theo định luật Hardy-Weinberg: $2pq = 2 \\times 0,6 \\times 0,4 = 0,48$.'],
  ['dr-sinh-21', 'Sinh học', 'Quần thể tự thụ phấn', 'Khó', 'Quần thể thực vật ban đầu có $100\\%$ cá thể mang kiểu gen dị hợp $Aa$. Sau $3$ thế hệ tự thụ phấn liên tiếp, tỉ lệ kiểu gen dị hợp $Aa$ ở $F_3$ là:', ['$12{,}5\\%$ ($1/8$)', '$25{,}0\\%$ ($1/4$)', '$50{,}0\\%$ ($1/2$)', '$6{,}25\\%$ ($1/16$)'], 'A', 'Qua mỗi thế hệ tự thụ phấn, tỉ lệ dị hợp giảm đi một nửa: $(1/2)^3 = 1/8 = 12,5\\%$.'],
  ['dr-sinh-22', 'Sinh học', 'Công nghệ DNA tái tổ hợp', 'Dễ', 'Trong công nghệ gen, thể truyền (vector) thường được sử dụng để chuyển gen vào vi khuẩn là:', ['Plasmid hoặc thực khuẩn thể (phage)', 'Ribosome', 'Lục lạp', 'Trung thể'], 'A', 'Plasmid là phân tử DNA dạng vòng nhỏ nằm ngoài NST vi khuẩn có khả năng tự nhân đôi độc lập.'],
  ['dr-sinh-23', 'Sinh học', 'Nuôi cấy hạt phấn', 'TB', 'Phương pháp nuôi cấy hạt phấn hoặc noãn chưa thụ tinh trong ống nghiệm rồi lưỡng bội hóa bằng colchicine có ưu điểm lớn nhất là:', ['Tạo ra các dòng thuần chủng về tất cả các cặp gen rất nhanh và ổn định', 'Tạo ra cơ thể lai khác loài có ưu thế lai cao nhất', 'Làm tăng tần số đột biến gen ngẫu nhiên', 'Tạo ra giống cây tam bội không hạt'], 'A', 'Từ đơn bội $n$ gây lưỡng bội hóa thành $2n$ sẽ đồng hợp tử tuyệt đối ở mọi locus gen.'],
  ['dr-sinh-24', 'Sinh học', 'Di truyền y học & Phả hệ', 'Khó', 'Hai vợ chồng bình thường nhưng đều mang gen dị hợp về bệnh bạch tạng ($Aa \\times Aa$). Xác suất họ sinh được một người con đầu lòng không mắc bệnh bạch tạng là:', ['$3/4$ ($75\\%$)', '$1/4$ ($25\\%$)', '$1/2$ ($50\\%$)', '$2/3$ ($66{,}7\\%$)'], 'A', '$Aa \\times Aa \\to 3/4 A-$ (bình thường) : $1/4 aa$ (bạch tạng).'],
  ['dr-sinh-25', 'Sinh học', 'Bằng chứng tiến hóa giải phẫu', 'Dễ', 'Chi trước của mèo, vây bơi của cá voi, cánh của dơi và tay người có cấu tạo xương tương tự nhau nhưng thực hiện chức năng khác nhau là bằng chứng về:', ['Cơ quan tương đồng (phản ánh tiến hóa phân li)', 'Cơ quan tương tự (phản ánh tiến hóa đồng quy)', 'Cơ quan thoái hóa', 'Bằng chứng phôi sinh học'], 'A', 'Cơ quan tương đồng có cùng nguồn gốc tổ tiên nhưng phân hóa chức năng theo môi trường sống.'],
  ['dr-sinh-26', 'Sinh học', 'Học thuyết tiến hóa hiện đại', 'TB', 'Theo thuyết tiến hóa tổng hợp hiện đại, đơn vị tiến hóa cơ sở là:', ['Quần thể', 'Cá thể', 'Loài', 'Quần xã'], 'A', 'Quần thể là đơn vị tồn tại thực tế có vốn gen biến đổi qua các thế hệ nên là đơn vị tiến hóa cơ sở.'],
  ['dr-sinh-27', 'Sinh học', 'Các nhân tố tiến hóa', 'TB', 'Nhân tố tiến hóa duy nhất quy định chiều hướng tiến hóa và tạo ra các đặc điểm thích nghi hợp lý trên cơ thể sinh vật là:', ['Chọn lọc tự nhiên', 'Đột biến', 'Giao phối không ngẫu nhiên', 'Phiêu bạt di truyền (các yếu tố ngẫu nhiên)'], 'A', 'Chọn lọc tự nhiên là nhân tố tiến hóa có hướng, sàng lọc các kiểu hình thích nghi.'],
  ['dr-sinh-28', 'Sinh học', 'Phiêu bạt di truyền', 'Khó', 'Nhân tố tiến hóa nào có thể làm một alen dù có lợi cũng có thể bị loại bỏ hoàn toàn khỏi quần thể nhỏ một cách tình cờ?', ['Phiêu bạt di truyền (các yếu tố ngẫu nhiên)', 'Chọn lọc tự nhiên', 'Di - nhập gen', 'Đột biến gen'], 'A', 'Các yếu tố ngẫu nhiên (lũ lụt, cháy rừng, hiệu ứng cổ chai) làm thay đổi đột ngột tần số alen không theo hướng thích nghi.'],
  ['dr-sinh-29', 'Sinh học', 'Cách li sinh sản', 'Dễ', 'Sự kiện đánh dấu sự hình thành một loài sinh học mới trong tự nhiên là:', ['Xuất hiện sự cách li sinh sản với quần thể gốc', 'Xuất hiện sự cách li địa lí hoàn toàn', 'Thay đổi màu sắc lông để ngụy trang', 'Tăng kích thước quần thể lên gấp đôi'], 'A', 'Cách li sinh sản là tiêu chuẩn quan trọng nhất phân biệt hai loài giao phối thân thuộc.'],
  ['dr-sinh-30', 'Sinh học', 'Hình thành loài bằng lai xa & đa bội hóa', 'TB', 'Hình thành loài mới bằng con đường lai xa và đa bội hóa thường phổ biến ở nhóm sinh vật nào?', ['Thực vật có hoa', 'Động vật có vú', 'Chim và bò sát', 'Vi khuẩn cổ'], 'A', 'Ở thực vật, rất nhiều loài cây trồng (như lúa mì $6n$) được hình thành nhanh chóng qua lai xa kèm đa bội hóa.'],
  ['dr-sinh-31', 'Sinh học', 'Giới hạn sinh thái', 'Dễ', 'Cá rô phi ở Việt Nam có giới hạn nhiệt độ từ $5{,}6^\\circ\\text{C}$ đến $42^\\circ\\text{C}$ và phát triển tốt nhất ở $30^\\circ\\text{C}$. Khoảng từ $5{,}6^\\circ\\text{C}$ đến $42^\\circ\\text{C}$ gọi là:', ['Giới hạn sinh thái về nhiệt độ', 'Khoảng thuận lợi', 'Khoảng chống chịu trên', 'Ổ sinh thái dinh dưỡng'], 'A', 'Khoảng giá trị từ điểm gây chết dưới đến điểm gây chết trên là giới hạn sinh thái của loài.'],
  ['dr-sinh-32', 'Sinh học', 'Ổ sinh thái', 'TB', 'Khi hai loài có ổ sinh thái dinh dưỡng trùng lặp nhau hoàn toàn và nguồn thức ăn bị hạn chế thì sẽ dẫn tới:', ['Cạnh tranh khác loài gay gắt (loài thua cuộc phải di cư hoặc phân li ổ sinh thái)', 'Quan hệ cộng sinh bắt buộc', 'Quan hệ hội sinh cùng có lợi', 'Tăng mật độ của cả hai loài'], 'A', 'Trùng lặp ổ sinh thái dẫn đến cạnh tranh; tiến hóa dẫn tới phân li ổ sinh thái để giảm cạnh tranh.'],
  ['dr-sinh-33', 'Sinh học', 'Đặc trưng của Quần thể sinh vật', 'Dễ', 'Đặc trưng nào sau đây là đặc trưng của quần thể sinh vật mà KHÔNG phải của một cá thể riêng lẻ?', ['Mật độ cá thể và tỉ lệ giới tính', 'Tuổi thọ sinh lí', 'Kiểu gen và kiểu hình', 'Tốc độ trao đổi chất'], 'A', 'Quần thể có các đặc trưng thống kê: tỉ lệ giới tính, nhóm tuổi, sự phân bố, mật độ cá thể, kích thước quần thể.'],
  ['dr-sinh-34', 'Sinh học', 'Quan hệ trong Quần xã sinh vật', 'Dễ', 'Mối quan hệ giữa vi khuẩn Rhizobium cố định đạm sống trong nốt sần rễ cây họ Đậu thuộc mối quan hệ:', ['Cộng sinh (cả hai loài cùng có lợi và gắn bó chặt chẽ)', 'Hội sinh', 'Kí sinh', 'Ức chế - cảm nhiễm'], 'A', 'Vi khuẩn cung cấp đạm cho cây đậu, cây đậu cung cấp chất hữu cơ và nơi ở cho vi khuẩn $\\Rightarrow$ cộng sinh.'],
  ['dr-sinh-35', 'Sinh học', 'Loài ưu thế & Loài đặc trưng', 'TB', 'Loài có số lượng cá thể nhiều, sinh khối lớn và hoạt động mạnh chi phối các loài khác trong quần xã được gọi là:', ['Loài ưu thế', 'Loài ngẫu nhiên', 'Loài ngoại lai xâm hại', 'Loài thứ yếu'], 'A', 'Loài ưu thế đóng vai trò quan trọng nhất quyết định chiều hướng phát triển của quần xã.'],
  ['dr-sinh-36', 'Sinh học', 'Chuỗi thức ăn & Bậc dinh dưỡng', 'TB', 'Trong chuỗi thức ăn: $\\text{Cỏ} \\to \\text{Châu chấu} \\to \\text{Ếch đồng} \\to \\text{Rắn} \\to \\text{Đại bàng}$, sinh vật thuộc bậc dinh dưỡng cấp 3 là:', ['Ếch đồng (sinh vật tiêu thụ bậc 2)', 'Châu chấu', 'Rắn', 'Cỏ'], 'A', 'Cỏ là bậc dinh dưỡng cấp 1, Châu chấu cấp 2, Ếch đồng là bậc dinh dưỡng cấp 3 (tiêu thụ bậc 2).'],
  ['dr-sinh-37', 'Sinh học', 'Hiệu suất sinh thái', 'Khó', 'Trong một hệ sinh thái, năng lượng tích lũy ở sinh vật sản xuất là $10^6\\text{ kcal}$, ở sinh vật tiêu thụ bậc 1 là $10^5\\text{ kcal}$, ở sinh vật tiêu thụ bậc 2 là $1{,}2\\times 10^4\\text{ kcal}$. Hiệu suất sinh thái giữa bậc dinh dưỡng cấp 3 so với bậc dinh dưỡng cấp 2 là:', ['$12\\%$', '$10\\%$', '$1{,}2\\%$', '$88\\%$'], 'A', 'Bậc 3 là tiêu thụ bậc 2 ($1,2\\times 10^4$), bậc 2 là tiêu thụ bậc 1 ($10^5$) $\\Rightarrow H = \\frac{1,2\\times 10^4}{10^5} \\times 100\\% = 12\\%$.'],
  ['dr-sinh-38', 'Sinh học', 'Diễn thế sinh thái', 'TB', 'Diễn thế sinh thái khởi đầu từ môi trường chưa có sinh vật (như trên đầm dung nham núi lửa mới nguội hoặc bãi cát mới bồi) được gọi là:', ['Diễn thế nguyên sinh', 'Diễn thế thứ sinh', 'Diễn thế phân hủy', 'Biến động số lượng theo chu kì'], 'A', 'Diễn thế nguyên sinh bắt đầu từ môi trường trống trơn và kết thúc bằng quần xã đỉnh cực.'],
  ['dr-sinh-39', 'Sinh học', 'Chu trình sinh địa hóa Carbon', 'Dễ', 'Quá trình sinh học chủ yếu giúp hấp thụ khí $\\text{CO}_2$ từ khí quyển chuyển thành chất hữu cơ trong sinh quyển là:', ['Quang hợp của thực vật xanh và tảo', 'Hô hấp hiếu khí của động vật', 'Đốt cháy nhiên liệu hóa thạch', 'Phân giải mùn bã hữu cơ của nấm'], 'A', 'Sinh vật tự dưỡng quang hợp đồng hóa $\\text{CO}_2$ và giải phóng $\\text{O}_2$.'],
  ['dr-sinh-40', 'Sinh học', 'Số lượng loại giao tử', 'TB', 'Một cơ thể có kiểu gen $AaBbDdEe$ (các gen phân li độc lập, không đột biến) giảm phân bình thường cho tối đa bao nhiêu loại giao tử?', ['$16$', '$8$', '$4$', '$32$'], 'A', 'Có 4 cặp gen dị hợp phân li độc lập $\\Rightarrow 2^4 = 16$ loại giao tử.'],
  ['dr-sinh-41', 'Sinh học', 'Tính số phân tử DNA con', 'TB', 'Một phân tử DNA nhân đôi liên tiếp $4$ lần tạo ra bao nhiêu phân tử DNA con, trong đó có bao nhiêu phân tử mang một mạch của DNA mẹ ban đầu?', ['$16$ phân tử DNA con, trong đó có $2$ phân tử mang mạch cũ', '$8$ phân tử DNA con, trong đó có $2$ phân tử mang mạch cũ', '$16$ phân tử DNA con, trong đó có $4$ phân tử mang mạch cũ', '$32$ phân tử DNA con, trong đó có $2$ phân tử mang mạch cũ'], 'A', 'Sau $k=4$ lần nhân đôi tạo $2^4 = 16$ DNA con; theo nguyên tắc bán bảo toàn luôn có đúng 2 DNA con chứa mạch gốc ban đầu.'],
  ['dr-sinh-42', 'Sinh học', 'Chiều dài & Số nucleotide của gen', 'Khó', 'Một gen ở sinh vật nhân sơ có chiều dài $4080\\text{ \\AA}$ (biết mỗi cặp nucleotide dài $3{,}4\\text{ \\AA}$). Tổng số nucleotide ($N$) của gen này là:', ['$2400$ nucleotide', '$1200$ nucleotide', '$4080$ nucleotide', '$3600$ nucleotide'], 'A', '$N = \\frac{2L}{3,4} = \\frac{2 \\times 4080}{3,4} = 2400$ nucleotide.'],
  ['dr-sinh-43', 'Sinh học', 'Số liên kết Hydrogen của gen', 'Khó', 'Một đoạn DNA có $A = 400$ và $G = 600$ nucleotide. Tổng số liên kết hydrogen ($H = 2A + 3G$) của đoạn DNA này là:', ['$2600$', '$2400$', '$2000$', '$3000$'], 'A', '$H = 2A + 3G = 2(400) + 3(600) = 800 + 1800 = 2600$ liên kết hydrogen.'],
  ['dr-sinh-44', 'Sinh học', 'Kiểm soát sinh học', 'Dễ', 'Việc sử dụng ong mắt đỏ để tiêu diệt sâu đục thân hại lúa là ứng dụng của biện pháp:', ['Đấu tranh sinh học (sử dụng thiên địch)', 'Gây đột biến nhân tạo', 'Sử dụng thuốc trừ sâu hóa học', 'Cạnh tranh cùng loài'], 'A', 'Dùng thiên địch khống chế sinh vật gây hại giúp bảo vệ mùa màng và tránh ô nhiễm môi trường.'],
  ['dr-sinh-45', 'Sinh học', 'Liệu pháp gen', 'TB', 'Liệu pháp gen (Gene therapy) trong y học hiện đại là phương pháp:', ['Chữa bệnh di truyền bằng cách thay thế gen bệnh bằng gen lành hoặc chỉnh sửa gen bị hỏng', 'Sử dụng kháng sinh liều cao tiêu diệt vi khuẩn kháng thuốc', 'Gây đột biến đa bội ở tế bào người', 'Tiêm vaccine phòng bệnh truyền nhiễm'], 'A', 'Liệu pháp gen can thiệp trực tiếp vào nguyên nhân di truyền để phục hồi chức năng tổng hợp protein bình thường.'],

  // ==================== TIẾNG ANH (45 CÂU) ====================
  ['dr-anh-1', 'Tiếng Anh', 'Ngữ pháp Thì & Sự phối thì', 'Dễ', 'By the time we arrived at the conference hall, the chemistry workshop ______.', ['had already started', 'already starts', 'is starting', 'was start'], 'A', '"By the time + S + V2/ed, S + had + V3/ed" diễn tả hành động xảy ra trước một hành động khác trong quá khứ.'],
  ['dr-anh-2', 'Tiếng Anh', 'Từ vựng & Collocations THPT', 'TB', 'Students should ______ advantage of the spaced repetition notebook to remember tricky formulas.', ['take', 'make', 'do', 'bring'], 'A', 'Collocation chuẩn: "take advantage of" (tận dụng).'],
  ['dr-anh-3', 'Tiếng Anh', 'Sự phối thì (Past Continuous)', 'Dễ', 'While Vo Thanh Phuc ______ a mock chemistry test last night, the power suddenly went out.', ['was taking', 'took', 'has taken', 'takes'], 'A', 'Hành động đang diễn ra trong quá khứ (was/were + V-ing) thì hành động khác xen vào (V2/ed).'],
  ['dr-anh-4', 'Tiếng Anh', 'Tương lai hoàn thành', 'TB', 'By the end of this academic year, our 12th-grade students ______ more than 50 full-length mock exams.', ['will have completed', 'completed', 'are completing', 'have completed'], 'A', '"By the end of + mốc tương lai" chia thì Tương lai hoàn thành (will have + V3/ed).'],
  ['dr-anh-5', 'Tiếng Anh', 'Câu điều kiện loại 2', 'Dễ', 'If I ______ more free time this weekend, I would join the volunteer campaign in the highland.', ['had', 'have', 'will have', 'had had'], 'A', 'Câu điều kiện loại 2 giả định trái với hiện tại: "If + S + V2/ed, S + would + V".'],
  ['dr-anh-6', 'Tiếng Anh', 'Câu điều kiện loại 3', 'TB', 'If she had revised the organic chemistry chapter carefully, she ______ that easy question.', ['wouldn\'t have missed', 'won\'t miss', 'wouldn\'t miss', 'hadn\'t missed'], 'A', 'Câu điều kiện loại 3 trái với quá khứ: "If + S + had + V3/ed, S + would(n\'t) have + V3/ed".'],
  ['dr-anh-7', 'Tiếng Anh', 'Đảo ngữ câu điều kiện', 'Khó', '______ you need any further assistance with the scholarship application, please do not hesitate to contact us.', ['Should', 'Were', 'Had', 'Unless'], 'A', 'Đảo ngữ câu điều kiện loại 1: "Should + S + V_inf, ...".'],
  ['dr-anh-8', 'Tiếng Anh', 'Đảo ngữ với Not only', 'TB', 'Not only ______ the first prize in the provincial Physics competition, but he also received a full scholarship.', ['did he win', 'he won', 'he did win', 'won he'], 'A', '"Not only + trợ động từ + S + V + but S also..." (đảo ngữ nhấn mạnh ở mệnh đề đầu).'],
  ['dr-anh-9', 'Tiếng Anh', 'Đảo ngữ với Hardly... when', 'Khó', 'Hardly ______ the laboratory when the fire alarm began to ring.', ['had we entered', 'we had entered', 'did we enter', 'have we entered'], 'A', 'Cấu trúc "Hardly/Scarcely + had + S + V3/ed + when + S + V2/ed" (Vừa mới... thì...).'],
  ['dr-anh-10', 'Tiếng Anh', 'Câu bị động đặc biệt', 'TB', 'The new metro line in Ho Chi Minh City ______ to reduce traffic congestion significantly.', ['is expected', 'expects', 'is expecting', 'has expected'], 'A', 'Bị động khách quan: "S + is/are expected + to V" (được kỳ vọng sẽ...).'],
  ['dr-anh-11', 'Tiếng Anh', 'Cấu trúc truyền khiến (Causative)', 'TB', 'My brother is going to have his laptop ______ before the online university entrance test.', ['repaired', 'repair', 'to repair', 'repairing'], 'A', 'Bị động truyền khiến: "have something + V3/ed" (nhờ ai sửa cái gì).'],
  ['dr-anh-12', 'Tiếng Anh', 'Mệnh đề quan hệ', 'Dễ', 'Marie Curie, ______ discovered radium and polonium, was the first woman to win a Nobel Prize.', ['who', 'whom', 'which', 'that'], 'A', 'Mệnh đề quan hệ không xác định (có dấu phẩy) chỉ người làm chủ ngữ dùng "who" (không dùng "that").'],
  ['dr-anh-13', 'Tiếng Anh', 'Rút gọn mệnh đề quan hệ', 'TB', 'The students ______ in the national STEM contest come from many provinces across Vietnam.', ['participating', 'participated', 'to participating', 'who participating'], 'A', 'Rút gọn mệnh đề quan hệ chủ động ("who are participating") bằng V-ing ("participating").'],
  ['dr-anh-14', 'Tiếng Anh', 'Rút gọn mệnh đề quan hệ với STT', 'Khó', 'Yuri Gagarin was the first human ______ into outer space in April 1961.', ['to fly', 'flying', 'flew', 'flown'], 'A', 'Sau số thứ tự (the first, the second, the last, the only...) rút gọn mệnh đề quan hệ bằng "to V".'],
  ['dr-anh-15', 'Tiếng Anh', 'So sánh kép (Double Comparatives)', 'TB', 'The more consistently you practice mock tests, ______ you will feel in the actual exam room.', ['the more confident', 'more confident', 'the most confident', 'the confidenter'], 'A', 'So sánh kép: "The + comparative + S + V, the + comparative + S + V" (Càng... càng...).'],
  ['dr-anh-16', 'Tiếng Anh', 'Mạo từ (Articles)', 'Dễ', 'Playing ______ guitar in the school club helps her unwind after intensive study sessions.', ['the', 'a', 'an', 'Ø (no article)'], 'A', 'Trước tên các nhạc cụ (guitar, piano, violin) với động từ "play", ta dùng mạo từ xác định "the".'],
  ['dr-anh-17', 'Tiếng Anh', 'Câu hỏi đuôi (Tag Questions)', 'TB', 'Let\'s review all 118 elements in the periodic table together tonight, ______?', ['shall we', 'will you', 'don\'t we', 'aren\'t we'], 'A', 'Câu bắt đầu bằng "Let\'s + V" luôn dùng câu hỏi đuôi là "shall we?".'],
  ['dr-anh-18', 'Tiếng Anh', 'Sự hòa hợp chủ ngữ - động từ', 'TB', 'The number of high school graduates choosing Artificial Intelligence majors ______ risen sharply.', ['has', 'have', 'are', 'were'], 'A', '"The number of + N(số nhiều)" luôn đi với động từ chia số ít ("has").'],
  ['dr-anh-19', 'Tiếng Anh', 'Danh động từ & Động từ nguyên mẫu', 'Dễ', 'Our teacher advised us ______ breaking down complex math problems into smaller steps.', ['to practice', 'practicing', 'practice', 'practiced'], 'A', 'Cấu trúc "advise somebody to do something" (khuyên ai làm gì).'],
  ['dr-anh-20', 'Tiếng Anh', 'Phân từ hoàn thành', 'Khó', '______ all the safety instructions carefully, the students started the titration experiment.', ['Having read', 'To read', 'Read', 'Being read'], 'A', 'Dùng phân từ hoàn thành "Having + V3/ed" khi rút gọn hai mệnh đề cùng chủ ngữ mà hành động xảy ra trước.'],
  ['dr-anh-21', 'Tiếng Anh', 'Động từ khuyết thiếu ở quá khứ', 'Khó', 'You ______ have left your student ID card in the library; the librarian just called to say she found it.', ['must', 'shouldn\'t', 'needn\'t', 'cannot'], 'A', '"must have + V3/ed" diễn tả suy luận chắc chắn có căn cứ về một việc đã xảy ra trong quá khứ.'],
  ['dr-anh-22', 'Tiếng Anh', 'Phrasal Verbs – Global Success 12', 'TB', 'Many traditional villages are trying to ______ their cultural heritage to younger generations.', ['pass down', 'turn down', 'break down', 'put off'], 'A', '"pass down" = truyền lại (di sản, nghề truyền thống) cho thế hệ sau.'],
  ['dr-anh-23', 'Tiếng Anh', 'Phrasal Verbs – Môi trường', 'TB', 'To promote green living, our school encourages students to ______ single-use plastic bottles.', ['cut down on', 'keep up with', 'look forward to', 'run out of'], 'A', '"cut down on" = cắt giảm lượng sử dụng.'],
  ['dr-anh-24', 'Tiếng Anh', 'Phrasal Verbs – Công việc', 'TB', 'Although the coding project was challenging, the team refused to ______ and finished on time.', ['give up', 'take off', 'put on', 'make up'], 'A', '"give up" = từ bỏ, bỏ cuộc.'],
  ['dr-anh-25', 'Tiếng Anh', 'Phrasal Verbs – Đời sống', 'Dễ', 'Please remember to ______ the lights and air conditioners before leaving the classroom.', ['turn off', 'turn up', 'look after', 'go over'], 'A', '"turn off" = tắt thiết bị điện.'],
  ['dr-anh-26', 'Tiếng Anh', 'Collocations – Nghề nghiệp', 'TB', 'Working as an intern at a tech company allows undergraduates to gain hands-on ______.', ['experience', 'experiment', 'existence', 'expectation'], 'A', '"gain hands-on experience" = tích lũy kinh nghiệm thực tiễn.'],
  ['dr-anh-27', 'Tiếng Anh', 'Collocations – Giáo dục', 'TB', 'Lifelong learning helps workers stay competitive and ______ pace with rapid technological changes.', ['keep', 'make', 'take', 'catch'], 'A', '"keep pace with" = bắt kịp tốc độ phát triển của cái gì.'],
  ['dr-anh-28', 'Tiếng Anh', 'Collocations – Nỗ lực', 'Dễ', 'Every candidate is making a great ______ to achieve 27+ points in the upcoming graduation exam.', ['effort', 'effect', 'offer', 'afford'], 'A', '"make an effort to V" = nỗ lực làm gì.'],
  ['dr-anh-29', 'Tiếng Anh', 'Word Formation (Cấu tạo từ)', 'TB', 'Artificial Intelligence has been ______ applied in medical diagnosis and personalized education.', ['successfully', 'success', 'successful', 'succeed'], 'A', 'Cần trạng từ ("successfully") đứng trước phân từ hai "applied" để bổ nghĩa cho động từ.'],
  ['dr-anh-30', 'Tiếng Anh', 'Word Formation – Đô thị hóa', 'TB', 'Rapid ______ has brought better infrastructure, but it also puts pressure on public housing.', ['urbanisation', 'urbanise', 'urban', 'urbanised'], 'A', 'Sau tính từ "Rapid" và làm chủ ngữ cho động từ "has brought" cần một danh từ ("urbanisation").'],
  ['dr-anh-31', 'Tiếng Anh', 'Giới từ đi với Tính từ', 'Dễ', 'Vietnamese cuisine is famous ______ its harmonious balance of fresh herbs and rich flavors.', ['for', 'with', 'about', 'in'], 'A', 'Cấu trúc "be famous for" = nổi tiếng về điều gì.'],
  ['dr-anh-32', 'Tiếng Anh', 'Giới từ – Bảo tồn thiên nhiên', 'TB', 'Many rare primates in tropical rainforests are now in danger ______ extinction due to habitat loss.', ['of', 'from', 'at', 'with'], 'A', 'Cụm cố định: "in danger of extinction" (có nguy cơ tuyệt chủng).'],
  ['dr-anh-33', 'Tiếng Anh', 'Liên từ & Mệnh đề nhượng bộ', 'TB', '______ the heavy rain, hundreds of students arrived at the exam venue thirty minutes early.', ['Despite', 'Although', 'Because', 'Because of'], 'A', 'Sau chỗ trống là cụm danh từ "the heavy rain" và mang nghĩa nhượng bộ nên dùng "Despite" (= In spite of).'],
  ['dr-anh-34', 'Tiếng Anh', 'Idioms – Học tập & Thi cử', 'Khó', 'Thanks to her daily practice on the K9 platform, she passed the English proficiency test with flying ______.', ['colours', 'flags', 'wings', 'stars'], 'A', 'Idiom "pass with flying colours" = vượt qua kỳ thi với điểm số xuất sắc.'],
  ['dr-anh-35', 'Tiếng Anh', 'Idioms – Quyết định', 'Khó', 'When choosing a university major, you should take your long-term career goals into ______.', ['account', 'mind', 'place', 'heart'], 'A', '"take something into account / consideration" = cân nhắc, tính đến điều gì.'],
  ['dr-anh-36', 'Tiếng Anh', 'Từ đồng nghĩa (CLOSEST in meaning)', 'TB', 'Switching to solar and wind power helps **reduce** carbon emissions into the atmosphere. The word "reduce" is closest in meaning to:', ['cut down', 'increase', 'preserve', 'expand'], 'A', '"reduce" = "cut down" / "decrease" (cắt giảm).'],
  ['dr-anh-37', 'Tiếng Anh', 'Từ trái nghĩa (OPPOSITE in meaning)', 'TB', 'In many big cities, affordable housing is becoming increasingly **scarce**. The word "scarce" is OPPOSITE in meaning to:', ['abundant', 'rare', 'limited', 'expensive'], 'A', '"scarce" (khan hiếm) >< "abundant" / "plentiful" (dồi dào, phong phú).'],
  ['dr-anh-38', 'Tiếng Anh', 'Giao tiếp xã hội (Communication)', 'Dễ', 'Lan: "Thank you so much for helping me solve this Oxyz geometry problem!" — Minh: "______"', ['You\'re welcome. Anytime!', 'Yes, I\'d love to.', 'Never mind, it\'s too late.', 'Congratulations on your prize!'], 'A', 'Đáp lại lời cảm ơn lịch sự dùng "You\'re welcome!" / "My pleasure!".'],
  ['dr-anh-39', 'Tiếng Anh', 'Cấu trúc giả định (Subjunctive)', 'Khó', 'It is essential that every laboratory student ______ protective goggles during chemical experiments.', ['wear', 'wears', 'wore', 'is wearing'], 'A', 'Thức giả định: "It is essential/vital/important that + S + (should) + V_inf" (động từ nguyên thể không chia).'],
  ['dr-anh-40', 'Tiếng Anh', 'Cấu trúc It is high time', 'Khó', 'It is high time local authorities ______ stricter measures to protect endangered sea turtles.', ['took', 'take', 'will take', 'have taken'], 'A', 'Cấu trúc "It\'s (high/about) time + S + V2/ed" (Đã đến lúc ai đó phải làm gì).'],
  ['dr-anh-41', 'Tiếng Anh', 'Cấu trúc so... that / such... that', 'TB', 'It was ______ an inspiring lecture on quantum physics that all students stayed behind to ask questions.', ['such', 'so', 'too', 'very'], 'A', 'Cấu trúc "such + a/an + adj + N(đếm được số ít) + that + S + V".'],
  ['dr-anh-42', 'Tiếng Anh', 'Từ vựng AI & Công nghệ (Unit 6 GS12)', 'TB', 'Virtual tutors powered by AI can provide instant ______ on students\' essays and pronunciation.', ['feedback', 'Setback', 'playback', 'background'], 'A', '"provide instant feedback" = đưa ra phản hồi/nhận xét tức thì.'],
  ['dr-anh-43', 'Tiếng Anh', 'Từ vựng Truyền thông (Unit 7 GS12)', 'TB', 'Critical readers always verify the source of online articles to avoid falling for ______ news.', ['fake', 'falsehood', 'imitation', 'artificial'], 'A', 'Collocation chuẩn: "fake news" (tin giả).'],
  ['dr-anh-44', 'Tiếng Anh', 'Cấu trúc used to / be used to', 'TB', 'First-year university students soon get used to ______ independently away from their parents.', ['living', 'live', 'lived', 'be lived'], 'A', '"be/get used to + V-ing" = quen với việc làm gì (khác với "used to + V_inf" = đã từng làm gì).'],
  ['dr-anh-45', 'Tiếng Anh', 'Cấu trúc would rather', 'Siêu khó', 'I would rather you ______ loud music while I am revising for tomorrow\'s Chemistry test.', ['didn\'t play', 'don\'t play', 'not play', 'haven\'t played'], 'A', '"S1 + would rather + S2 + V2/ed (didn\'t V)" diễn tả mong muốn ai đó làm/đừng làm gì ở hiện tại.'],

  // ==================== LỊCH SỬ (50 CÂU) ====================
  ['dr-su-1', 'Lịch sử', 'Lịch sử Việt Nam 1945–1954', 'Dễ', 'Chiến dịch nào đã làm phá sản hoàn toàn kế hoạch Nava của thực dân Pháp và can thiệp Mỹ năm 1954?', ['Chiến dịch Điện Biên Phủ', 'Chiến dịch Việt Bắc thu - đông', 'Chiến dịch Biên giới thu - đông', 'Chiến dịch Hồ Chí Minh'], 'A', 'Chiến thắng Điện Biên Phủ (7/5/1954) đập tan hoàn toàn kế hoạch Nava, buộc Pháp ký Hiệp định Giơnevơ.'],
  ['dr-su-2', 'Lịch sử', 'Liên Hợp Quốc (UN)', 'Dễ', 'Hội nghị quốc tế thông qua Hiến chương và tuyên bố thành lập tổ chức Liên Hợp Quốc (1945) diễn ra tại:', ['San Francisco (Mỹ)', 'Ianta (Liên Xô)', 'Potsdam (Đức)', 'Paris (Pháp)'], 'A', 'Đại biểu 50 nước họp tại San Francisco (Mỹ) thông qua Hiến chương Liên Hợp Quốc (có hiệu lực ngày 24/10/1945).'],
  ['dr-su-3', 'Lịch sử', 'Trật tự hai cực Ianta', 'TB', 'Theo quyết định của Hội nghị Ianta (tháng 2/1945), hai cường quốc đứng đầu hai cực chi phối quan hệ quốc tế sau Chiến tranh thế giới thứ hai là:', ['Liên Xô và Mỹ', 'Anh và Pháp', 'Mỹ và Trung Quốc', 'Liên Xô và Anh'], 'A', 'Trật tự thế giới mới sau Thế chiến II được gọi là Trật tự hai cực Ianta do Liên Xô và Mỹ đứng đầu.'],
  ['dr-su-4', 'Lịch sử', 'Sự sụp đổ Trật tự hai cực Ianta', 'TB', 'Sự kiện đánh dấu sự chấm dứt hoàn toàn của Trật tự hai cực Ianta vào năm 1991 là:', ['Sự tan rã của Liên bang Cộng hòa xã hội chủ nghĩa Xô viết (Liên Xô)', 'Bức tường Berlin sụp đổ năm 1989', 'Cuộc gặp không chính thức tại đảo Malta', 'Hiệp định Paris về Việt Nam được ký kết'], 'A', 'Tháng 12/1991, Liên Xô tan rã làm cực Xô viết không còn, Trật tự hai cực Ianta hoàn toàn sụp đổ.'],
  ['dr-su-5', 'Lịch sử', 'Xu thế thế giới sau Chiến tranh lạnh', 'Dễ', 'Sau khi Chiến tranh lạnh chấm dứt, trật tự thế giới mới đang vận động theo xu thế chủ đạo nào?', ['Xu thế đa cực, nhiều trung tâm quyền lực và lấy phát triển kinh tế làm trọng tâm', 'Xu thế đơn cực do một siêu cường chi phối vĩnh viễn', 'Xu thế chạy đua vũ trang hạt nhân toàn cầu', 'Xu thế đóng cửa biệt lập giữa các châu lục'], 'A', 'Thế giới sau Chiến tranh lạnh phát triển theo xu thế đa cực, đa trung tâm và lấy kinh tế làm trọng điểm.'],
  ['dr-su-6', 'Lịch sử', 'Sự thành lập ASEAN', 'Dễ', 'Hiệp hội các quốc gia Đông Nam Á (ASEAN) được thành lập ngày 8/8/1967 tại Băng Cốc (Thái Lan) với sự tham gia của 5 nước sáng lập là:', ['Indonesia, Malaysia, Philippines, Singapore và Thái Lan', 'Việt Nam, Lào, Campuchia, Thái Lan và Myanmar', 'Thái Lan, Singapore, Brunei, Việt Nam và Malaysia', 'Indonesia, Philippines, Brunei, Lào và Singapore'], 'A', '5 nước sáng lập ASEAN tại Băng Cốc năm 1967 gồm Indonesia, Malaysia, Philippines, Singapore và Thái Lan.'],
  ['dr-su-7', 'Lịch sử', 'Việt Nam gia nhập ASEAN', 'Dễ', 'Việt Nam chính thức trở thành thành viên thứ 7 của Hiệp hội các quốc gia Đông Nam Á (ASEAN) vào thời gian nào?', ['Ngày 28/7/1995', 'Ngày 8/8/1967', 'Ngày 30/4/1999', 'Ngày 31/12/2015'], 'A', 'Ngày 28/7/1995, tại Hội nghị Bộ trưởng Ngoại giao ASEAN ở Brunei, Việt Nam chính thức trở thành thành viên thứ 7 của ASEAN.'],
  ['dr-su-8', 'Lịch sử', 'Hiến chương & Cộng đồng ASEAN', 'TB', 'Ba trụ cột chính của Cộng đồng ASEAN (thành lập ngày 31/12/2015) bao gồm:', ['Cộng đồng Chính trị – An ninh (APSC), Cộng đồng Kinh tế (AEC) và Cộng đồng Văn hóa – Xã hội (ASCC)', 'Cộng đồng Quân sự, Cộng đồng Tiền tệ chung và Cộng đồng Giáo dục', 'Cộng đồng Kinh tế, Cộng đồng Quốc phòng và Cộng đồng Năng lượng', 'Cộng đồng Thương mại tự do, Cộng đồng Ngoại giao và Cộng đồng Du lịch'], 'A', 'Cộng đồng ASEAN được xây dựng trên 3 trụ cột: APSC, AEC và ASCC.'],
  ['dr-su-9', 'Lịch sử', 'Cách mạng tháng Tám năm 1945', 'Dễ', 'Điều kiện khách quan thuận lợi nhất tạo thời cơ "ngàn năm có một" cho Tổng khởi nghĩa tháng Tám năm 1945 ở Việt Nam là:', ['Phát xít Nhật đầu hàng Đồng minh không điều kiện (15/8/1945)', 'Thực dân Pháp quay trở lại xâm lược Đông Dương', 'Chiến tranh thế giới thứ hai bắt đầu bùng nổ (1939)', 'Liên Xô đánh bại phát xít Đức tại mặt trận Stalingrad'], 'A', 'Nhật đầu hàng Đồng minh ngày 15/8/1945 khiến quân Nhật ở Đông Dương rệu rã, tạo thời cơ Tổng khởi nghĩa trước khi quân Đồng minh vào.'],
  ['dr-su-10', 'Lịch sử', 'Tuyên ngôn Độc lập 2/9/1945', 'Dễ', 'Ngày 2/9/1945, tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đã đọc Tuyên ngôn Độc lập khai sinh ra:', ['Nước Việt Nam Dân chủ Cộng hòa', 'Nước Cộng hòa xã hội chủ nghĩa Việt Nam', 'Mặt trận Việt Minh', 'Chính phủ Cách mạng lâm thời miền Nam Việt Nam'], 'A', 'Tuyên ngôn Độc lập 2/9/1945 khai sinh nước Việt Nam Dân chủ Cộng hòa — nhà nước công nông đầu tiên ở Đông Nam Á.'],
  ['dr-su-11', 'Lịch sử', 'Bảo vệ chính quyền 1945–1946', 'TB', 'Sau Cách mạng tháng Tám năm 1945, Chủ tịch Hồ Chí Minh đã gọi ba thứ giặc nguy hiểm đe dọa vận mệnh dân tộc là:', ['Giặc đói, giặc dốt và giặc ngoại xâm', 'Giặc Pháp, giặc Nhật và giặc Tưởng', 'Giặc hạn hán, giặc lũ lụt và giặc ngoại xâm', 'Giặc nội phản, giặc kinh tế và giặc văn hóa'], 'A', 'Tình thế "ngàn cân treo sợi tóc" sau ngày 2/9/1945 phải đối phó cùng lúc với giặc đói, giặc dốt và giặc ngoại xâm.'],
  ['dr-su-12', 'Lịch sử', 'Toàn quốc kháng chiến 19/12/1946', 'Dễ', 'Câu nói bất hủ: "Chúng ta thà hy sinh tất cả, chứ nhất định không chịu mất nước, nhất định không chịu làm nô lệ!" trích trong văn kiện nào của Chủ tịch Hồ Chí Minh?', ['Lời kêu gọi toàn quốc kháng chiến (19/12/1946)', 'Tuyên ngôn Độc lập (2/9/1945)', 'Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta', 'Lời kêu gọi chống Mỹ, cứu nước (17/7/1966)'], 'A', 'Đêm 19/12/1946, Chủ tịch Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến chống thực dân Pháp.'],
  ['dr-su-13', 'Lịch sử', 'Chiến dịch Việt Bắc thu - đông 1947', 'TB', 'Thắng lợi của quân dân ta trong Chiến dịch Việt Bắc thu – đông năm 1947 đã làm phá sản hoàn toàn âm mưu nào của thực dân Pháp?', ['Chiến lược "đánh nhanh thắng nhanh"', 'Kế hoạch Rơ-ve khóa chặt biên giới', 'Kế hoạch Đờ Lát đơ Tát-xi-nhi', 'Kế hoạch quân sự Nava'], 'A', 'Chiến thắng Việt Bắc 1947 bảo vệ an toàn cơ quan đầu não kháng chiến, buộc Pháp phải chuyển từ "đánh nhanh thắng nhanh" sang đánh lâu dài.'],
  ['dr-su-14', 'Lịch sử', 'Chiến dịch Biên giới thu - đông 1950', 'TB', 'Ý nghĩa chiến lược quan trọng nhất của Chiến dịch Biên giới thu – đông năm 1950 là:', ['Khai thông biên giới Việt – Trung và quân ta giành được quyền chủ động chiến lược trên chiến trường chính Bắc Bộ', 'Buộc Pháp phải ngồi vào bàn đàm phán tại Giơnevơ', 'Giải phóng hoàn toàn thủ đô Hà Nội', 'Đánh bại hoàn toàn sự can thiệp của Mỹ'], 'A', 'Sau Chiến dịch Biên giới 1950, cách mạng Việt Nam thoát thế bao vây và nắm quyền chủ động trên chiến trường chính Bắc Bộ.'],
  ['dr-su-15', 'Lịch sử', 'Đại hội đại biểu toàn quốc lần II (1951)', 'TB', 'Đại hội đại biểu toàn quốc lần thứ II của Đảng (tháng 2/1951 tại Chiêm Hóa, Tuyên Quang) đã quyết định đưa Đảng ra hoạt động công khai với tên gọi:', ['Đảng Lao động Việt Nam', 'Đảng Cộng sản Đông Dương', 'Đảng Cộng sản Việt Nam', 'Mặt trận Liên Việt'], 'A', 'Đại hội II (2/1951) quyết định thành lập ở mỗi nước Đông Dương một đảng cách mạng riêng; ở Việt Nam lấy tên là Đảng Lao động Việt Nam.'],
  ['dr-su-16', 'Lịch sử', 'Hiệp định Giơnevơ 1954', 'TB', 'Theo Hiệp định Giơnevơ năm 1954 về Đông Dương, giới tuyến quân sự tạm thời giữa hai miền Nam – Bắc Việt Nam được quy định tại:', ['Vĩ tuyến 17 (dọc sông Bến Hải, tỉnh Quảng Trị)', 'Vĩ tuyến 16', 'Vĩ tuyến 38', 'Đèo Hải Vân'], 'A', 'Vĩ tuyến 17 (sông Bến Hải – cầu Hiền Lương) là giới tuyến quân sự tạm thời, hoàn toàn không phải ranh giới chính trị hay lãnh thổ.'],
  ['dr-su-17', 'Lịch sử', 'Phong trào Đồng khởi (1959–1960)', 'TB', 'Thắng lợi của phong trào "Đồng khởi" (1959–1960) ở miền Nam Việt Nam (tiêu biểu tại Bến Tre) đã dẫn đến sự ra đời của tổ chức nào vào ngày 20/12/1960?', ['Mặt trận Dân tộc giải phóng miền Nam Việt Nam', 'Liên minh các lực lượng dân tộc, dân chủ và hòa bình Việt Nam', 'Hội Liên hiệp Phụ nữ giải phóng', 'Quân đoàn chủ lực cơ động Đông Nam Bộ'], 'A', 'Đồng khởi chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công, khai sinh Mặt trận Dân tộc giải phóng miền Nam Việt Nam (20/12/1960).'],
  ['dr-su-18', 'Lịch sử', 'Chiến tranh đặc biệt (1961–1965)', 'TB', 'Chiến thắng mở màn chứng minh quân dân miền Nam hoàn toàn có khả năng đánh bại chiến thuật "trực thăng vận", "thiết xa vận" trong chiến lược "Chiến tranh đặc biệt" của Mỹ là:', ['Chiến thắng Ấp Bắc (Mỹ Tho, ngày 2/1/1963)', 'Chiến thắng Vạn Tường (Quảng Ngãi, 1965)', 'Chiến thắng Bình Giã (Bà Rịa, 1964)', 'Chiến thắng Đường 14 – Phước Long'], 'A', 'Chiến thắng Ấp Bắc (2/1/1963) mở đầu phong trào "Thi đua Ấp Bắc, giết giặc lập công".'],
  ['dr-su-19', 'Lịch sử', 'Chiến tranh cục bộ (1965–1968)', 'TB', 'Trận đọ sức đầu tiên thắng lợi vang dội của bộ đội chủ lực ta với quân viễn chinh Mỹ vào tháng 8/1965, được ví như "Ấp Bắc" đối với quân Mỹ, là:', ['Chiến thắng Vạn Tường (Quảng Ngãi)', 'Chiến thắng Núi Thành', 'Chiến thắng Đồng Xoài', 'Chiến thắng Ba Gia'], 'A', 'Chiến thắng Vạn Tường (18/8/1965) chứng tỏ quân dân miền Nam có khả năng đánh thắng quân viễn chinh Mỹ trong "Chiến tranh cục bộ".'],
  ['dr-su-20', 'Lịch sử', 'Tổng tiến công Xuân Mậu Thân 1968', 'Khó', 'Ý nghĩa chiến lược lớn nhất của cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân năm 1968 là:', ['Làm lung lay ý chí xâm lược của Mỹ, buộc Mỹ tuyên bố "phi Mỹ hóa" chiến tranh và chấp nhận đàm phán tại Paris', 'Buộc Mỹ phải ký ngay Hiệp định Paris vào đầu năm 1968', 'Giải phóng hoàn toàn miền Nam Việt Nam', 'Đánh bại hoàn toàn chiến lược Việt Nam hóa chiến tranh'], 'A', 'Mậu Thân 1968 mở ra cục diện "vừa đánh vừa đàm", buộc Mỹ chấm dứt ném bom miền Bắc và ngồi vào bàn đàm phán Paris.'],
  ['dr-su-21', 'Lịch sử', 'Điện Biên Phủ trên không 1972', 'TB', 'Thắng lợi của quân dân miền Bắc trong 12 ngày đêm cuối tháng 12/1972 ("Điện Biên Phủ trên không") chống tập kích bằng máy bay B-52 của Mỹ đã trực tiếp buộc Mỹ phải:', ['Ký Hiệp định Paris (27/1/1973) về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam', 'Chuyển sang chiến lược Chiến tranh đặc biệt', 'Mở cuộc hành quân Lam Sơn 719 sang Lào', 'Thiết lập quan hệ ngoại giao chính thức ngay lập tức với Việt Nam'], 'A', 'Chiến thắng "Điện Biên Phủ trên không" (18–29/12/1972) đập tan nỗ lực quân sự cao nhất của Mỹ, buộc Mỹ ký Hiệp định Paris ngày 27/1/1973.'],
  ['dr-su-22', 'Lịch sử', 'Hiệp định Paris (27/1/1973)', 'Khó', 'Nội dung nào của Hiệp định Paris năm 1973 đã tạo ra sự thay đổi căn bản về so sánh lực lượng có lợi cho cách mạng miền Nam ("đánh cho Mỹ cút")?', ['Hoa Kỳ và các nước đồng minh phải rút hết quân viễn chinh và nhân viên quân sự ra khỏi miền Nam Việt Nam', 'Chính quyền Sài Gòn tự giải tán ngay lập tức', 'Hai miền Nam – Bắc tổ chức tổng tuyển cử vào tháng 7/1973', 'Mỹ bồi thường toàn bộ chiến phí ngay trong năm 1973'], 'A', 'Quân Mỹ và đồng minh rút hết khỏi miền Nam làm chỗ dựa của chính quyền Sài Gòn suy yếu nghiêm trọng, tạo thời cơ "đánh cho ngụy nhào".'],
  ['dr-su-23', 'Lịch sử', 'Chiến thắng Đường 14 – Phước Long', 'Khó', 'Chiến thắng nào vào cuối năm 1974 – đầu năm 1975 được xem là "trận trinh sát chiến lược", củng cố quyết tâm giải phóng hoàn toàn miền Nam của Bộ Chính trị?', ['Chiến thắng Đường 14 – Phước Long (6/1/1975)', 'Chiến dịch Tây Nguyên (3/1975)', 'Chiến dịch Huế – Đà Nẵng (3/1975)', 'Chiến dịch Xuân Lộc (4/1975)'], 'A', 'Giải phóng tỉnh Phước Long (6/1/1975) cho thấy sự suy yếu của quân đội Sài Gòn và khả năng can thiệp trở lại bằng quân sự của Mỹ là rất hạn chế.'],
  ['dr-su-24', 'Lịch sử', 'Tổng tiến công và nổi dậy Xuân 1975', 'Dễ', 'Ba chiến dịch lớn liên tiếp trong cuộc Tổng tiến công và nổi dậy Xuân năm 1975 theo thứ tự thời gian là:', ['Chiến dịch Tây Nguyên → Chiến dịch Huế – Đà Nẵng → Chiến dịch Hồ Chí Minh', 'Chiến dịch Huế – Đà Nẵng → Chiến dịch Tây Nguyên → Chiến dịch Hồ Chí Minh', 'Chiến dịch Phước Long → Chiến dịch Quảng Trị → Chiến dịch Hồ Chí Minh', 'Chiến dịch Tây Nguyên → Chiến dịch Xuân Lộc → Chiến dịch Huế'], 'A', 'Mở màn bằng Chiến dịch Tây Nguyên (then chốt Buôn Ma Thuột 10/3), tiếp theo là Huế – Đà Nẵng và đỉnh cao là Chiến dịch Hồ Chí Minh (26–30/4/1975).'],
  ['dr-su-25', 'Lịch sử', 'Thống nhất đất nước về mặt nhà nước', 'TB', 'Kỳ họp thứ nhất Quốc hội khóa VI của nước Việt Nam thống nhất (tháng 6 – 7/1976) đã quyết định đổi tên nước thành:', ['Cộng hòa xã hội chủ nghĩa Việt Nam', 'Việt Nam Dân chủ Cộng hòa', 'Liên bang Cộng hòa Việt Nam', 'Cộng hòa Nhân dân Việt Nam'], 'A', 'Tháng 7/1976, Quốc hội khóa VI quyết định lấy tên nước là Cộng hòa xã hội chủ nghĩa Việt Nam, Thủ đô là Hà Nội, đổi tên Sài Gòn – Gia Định thành TP. Hồ Chí Minh.'],
  ['dr-su-26', 'Lịch sử', 'Bảo vệ biên giới Tổ quốc (1975–1979)', 'TB', 'Cuối những năm 1970, quân và dân Việt Nam vừa phải khôi phục kinh tế sau chiến tranh, vừa phải kiên quyết chiến đấu bảo vệ chủ quyền lãnh thổ ở:', ['Biên giới Tây Nam (chống tập đoàn Pol Pot) và biên giới phía Bắc (1979)', 'Khu vực giới tuyến vĩ tuyến 17', 'Tây Nguyên và đồng bằng Bắc Bộ', 'Bán đảo Sơn Trà và vịnh Cam Ranh'], 'A', 'Quân dân ta chiến đấu bảo vệ biên giới Tây Nam (và giúp nhân dân Campuchia thoát nạn diệt chủng năm 1979) cùng cuộc chiến đấu bảo vệ biên giới phía Bắc.'],
  ['dr-su-27', 'Lịch sử', 'Công cuộc Đổi mới đất nước (1986)', 'Dễ', 'Đường lối Đổi mới toàn diện đất nước do Đảng Cộng sản Việt Nam khởi xướng được đề ra tại Đại hội đại biểu toàn quốc lần thứ mấy?', ['Đại hội lần thứ VI (tháng 12/1986)', 'Đại hội lần thứ IV (1976)', 'Đại hội lần thứ V (1982)', 'Đại hội lần thứ VII (1991)'], 'A', 'Đại hội VI của Đảng (12/1986) đề ra đường lối Đổi mới toàn diện, trọng tâm là đổi mới về kinh tế.'],
  ['dr-su-28', 'Lịch sử', 'Trọng tâm đường lối Đổi mới kinh tế', 'TB', 'Nội dung cốt lõi về đổi mới kinh tế của Việt Nam từ năm 1986 đến nay là xóa bỏ cơ chế tập trung quan liêu bao cấp, chuyển sang:', ['Phát triển nền kinh tế hàng hóa nhiều thành phần định hướng xã hội chủ nghĩa', 'Nền kinh tế chỉ có một thành phần quốc doanh duy nhất', 'Cơ chế phân phối bằng tem phiếu hiện vật', 'Nền kinh tế tự cung tự cấp khép kín'], 'A', 'Việt Nam phát triển nền kinh tế thị trường định hướng xã hội chủ nghĩa với nhiều thành phần kinh tế cùng phát triển.'],
  ['dr-su-29', 'Lịch sử', 'Hội nhập quốc tế của Việt Nam', 'TB', 'Tháng 1/2007, Việt Nam ghi dấu mốc quan trọng trong tiến trình hội nhập kinh tế toàn cầu khi chính thức trở thành thành viên thứ 150 của tổ chức nào?', ['Tổ chức Thương mại Thế giới (WTO)', 'Liên Hợp Quốc (UN)', 'Diễn đàn Hợp tác Kinh tế châu Á – Thái Bình Dương (APEC)', 'Quỹ Tiền tệ Quốc tế (IMF)'], 'A', 'Ngày 11/1/2007, Việt Nam chính thức trở thành thành viên thứ 150 của Tổ chức Thương mại Thế giới (WTO).'],
  ['dr-su-30', 'Lịch sử', 'Bảo vệ chủ quyền Biển Đông', 'TB', 'Văn bản pháp lý quan trọng bậc nhất được mệnh danh là "Hiến pháp về biển và đại dương", làm cơ sở pháp lý quốc tế để Việt Nam đấu tranh hòa bình bảo vệ chủ quyền trên Biển Đông là:', ['Công ước của Liên Hợp Quốc về Luật Biển năm 1982 (UNCLOS 1982)', 'Hiệp ước Bali năm 1976 của ASEAN', 'Tuyên bố Băng Cốc năm 1967', 'Hiến chương ASEAN năm 2007'], 'A', 'UNCLOS 1982 quy định rõ lãnh hải 12 hải lý, vùng đặc quyền kinh tế 200 hải lý và thềm lục địa, là căn cứ pháp lý quốc tế vững chắc của Việt Nam.'],
  ['dr-su-31', 'Lịch sử', 'Chủ quyền Hoàng Sa và Trường Sa', 'Dễ', 'Hai quần đảo tiền tiêu trên Biển Đông thuộc chủ quyền không thể tranh cãi của Việt Nam với đầy đủ bằng chứng lịch sử và pháp lý từ thời phong kiến (Đội Hoàng Sa, Đội Bắc Hải) là:', ['Quần đảo Hoàng Sa và quần đảo Trường Sa', 'Quần đảo Côn Đảo và đảo Phú Quốc', 'Quần đảo Thổ Chu và đảo Bạch Long Vĩ', 'Quần đảo Cát Bà và đảo Lý Sơn'], 'A', 'Nhà nước Việt Nam qua các thời kỳ đã xác lập và thực thi chủ quyền liên tục, hòa bình đối với hai quần đảo Hoàng Sa và Trường Sa.'],
  ['dr-su-32', 'Lịch sử', 'Hành trình tìm đường cứu nước của Nguyễn Ái Quốc', 'Dễ', 'Ngày 5/6/1911, người thanh niên yêu nước Nguyễn Tất Thành đã rời Bến cảng Nhà Rồng (Sài Gòn) ra đi tìm đường cứu nước trên con tàu buôn của Pháp mang tên:', ['Amiral Latouche-Tréville', 'Rạng Đông (Aurora)', 'Espérance', 'Saint-Nazaire'], 'A', 'Nguyễn Tất Thành lấy tên Văn Ba làm phụ bếp trên tàu Đô đốc Latouche-Tréville rời bến Nhà Rồng ngày 5/6/1911.'],
  ['dr-su-33', 'Lịch sử', 'Bước ngoặt tư tưởng Hồ Chí Minh (1920)', 'TB', 'Tháng 7/1920, Nguyễn Ái Quốc tìm thấy con đường cứu nước giải phóng dân tộc theo khuynh hướng cách mạng vô sản khi đọc văn kiện nào của V.I. Lênin?', ['Sơ thảo lần thứ nhất những luận cương về vấn đề dân tộc và vấn đề thuộc địa', 'Tuyên ngôn của Đảng Cộng sản', 'Bộ Tư bản', 'Nhà nước và Cách mạng'], 'A', 'Luận cương của Lênin đăng trên báo Nhân đạo (7/1920) đã giúp Nguyễn Ái Quốc khẳng định: "Muốn cứu nước và giải phóng dân tộc không có con đường nào khác con đường cách mạng vô sản".'],
  ['dr-su-34', 'Lịch sử', 'Thành lập Đảng Cộng sản Việt Nam (3/2/1930)', 'Dễ', 'Đầu năm 1930, tại Cửu Long (Hương Cảng, Trung Quốc), Nguyễn Ái Quốc đã triệu tập hội nghị hợp nhất các tổ chức cộng sản thành một chính đảng duy nhất lấy tên là:', ['Đảng Cộng sản Việt Nam', 'Đảng Cộng sản Đông Dương', 'Đảng Lao động Việt Nam', 'Hội Việt Nam Cách mạng Thanh niên'], 'A', 'Hội nghị hợp nhất (từ 6/1 đến 7/2/1930) hợp nhất Đông Dương Cộng sản đảng và An Nam Cộng sản đảng thành Đảng Cộng sản Việt Nam và thông qua Cương lĩnh chính trị đầu tiên.'],
  ['dr-su-35', 'Lịch sử', 'Hội nghị Trung ương 8 (tháng 5/1941)', 'TB', 'Tháng 5/1941, tại Pác Bó (Cao Bằng), Hội nghị Trung ương 8 do Nguyễn Ái Quốc chủ trì đã quyết định thành lập mặt trận dân tộc thống nhất mang tên:', ['Mặt trận Việt Nam Độc lập Đồng minh (Việt Minh)', 'Mặt trận Liên Việt', 'Mặt trận Tổ quốc Việt Nam', 'Mặt trận Dân chủ Đông Dương'], 'A', 'Hội nghị Trung ương 8 (5/1941) đặt nhiệm vụ giải phóng dân tộc lên hàng đầu và thành lập Mặt trận Việt Minh.'],
  ['dr-su-36', 'Lịch sử', 'Thành lập Quân đội nhân dân Việt Nam', 'Dễ', 'Ngày 22/12/1944, theo chỉ thị của lãnh tụ Hồ Chí Minh, đội vũ trang tiền thân của Quân đội nhân dân Việt Nam được thành lập tại Cao Bằng do đồng chí Võ Nguyên Giáp chỉ huy là:', ['Đội Việt Nam Tuyên truyền Giải phóng quân', 'Đội Cứu quốc quân Bắc Sơn', 'Đội Du kích Ba Tơ', 'Vệ quốc đoàn'], 'A', 'Đội Việt Nam Tuyên truyền Giải phóng quân thành lập ngày 22/12/1944 với 34 chiến sĩ tại rừng Trần Hưng Đạo (Cao Bằng).'],
  ['dr-su-37', 'Lịch sử', 'Ngoại giao Việt Nam năm 1946', 'Khó', 'Việc ký Hiệp định Sơ bộ (6/3/1946) và Tạm ước (14/9/1946) với Pháp thể hiện nghệ thuật ngoại giao tài tình nào của Đảng và Chủ tịch Hồ Chí Minh?', ['"Hòa để tiến" — nhanh chóng đẩy 20 vạn quân Trung Hoa Dân quốc về nước và tranh thủ thời gian chuẩn bị lực lượng kháng chiến lâu dài', 'Chấp nhận nhượng bộ hoàn toàn chủ quyền để tránh chiến tranh', 'Liên minh quân sự với Pháp để chống Mỹ', 'Phát động ngay cuộc chiến tranh tổng lực ở cả hai miền'], 'A', 'Hiệp định Sơ bộ 6/3/1946 biến hiệp ước 2 bên Pháp – Hoa thành thỏa thuận 3 bên, gạt nhanh 20 vạn quân Tưởng về nước và có thêm thời gian quý báu chuẩn bị lực lượng.'],
  ['dr-su-38', 'Lịch sử', 'Phương châm kháng chiến chống Pháp', 'Dễ', 'Đường lối kháng chiến chống thực dân Pháp (1946–1954) của Đảng ta được xác định là:', ['Toàn dân, toàn diện, trường kỳ, tự lực cánh sinh và tranh thủ sự ủng hộ quốc tế', 'Đánh nhanh thắng nhanh dựa hoàn toàn vào viện trợ bên ngoài', 'Chỉ đấu tranh quân sự ở các đô thị lớn', 'Chỉ đấu tranh ngoại giao tại Liên Hợp Quốc'], 'A', 'Đường lối kháng chiến được nêu rõ trong Lời kêu gọi toàn quốc kháng chiến và tác phẩm Kháng chiến nhất định thắng lợi.'],
  ['dr-su-39', 'Lịch sử', 'Đại hội III của Đảng (9/1960)', 'TB', 'Đại hội đại biểu toàn quốc lần thứ III của Đảng (9/1960) đã xác định cách mạng xã hội chủ nghĩa ở miền Bắc giữ vai trò gì đối với sự nghiệp giải phóng miền Nam?', ['Vai trò quyết định nhất đối với sự phát triển của toàn bộ cách mạng Việt Nam', 'Vai trò quyết định trực tiếp đánh đổ ách thống trị của Mỹ - Diệm ở miền Nam', 'Vai trò hỗ trợ phụ thuộc hoàn toàn vào tiền tuyến', 'Vai trò trung lập về quân sự'], 'A', 'Miền Bắc là hậu phương lớn giữ vai trò quyết định nhất; miền Nam là tiền tuyến lớn giữ vai trò quyết định trực tiếp.'],
  ['dr-su-40', 'Lịch sử', 'Chiến dịch Điện Biên Phủ (1954)', 'TB', 'Phương châm tác chiến trong Chiến dịch Điện Biên Phủ năm 1954 đã được Đại tướng Võ Nguyên Giáp và Đảng ủy Mặt trận quyết định thay đổi từ "đánh nhanh, giải quyết nhanh" sang:', ['"Đánh chắc, tiến chắc"', '"Đánh điểm, diệt viện"', '"Bao vây, cô lập lâu dài"', '"Du kích vận động chiến"'], 'A', 'Quyết định lịch sử chuyển từ "đánh nhanh, giải quyết nhanh" sang "đánh chắc, tiến chắc" là nhân tố quyết định đưa Chiến dịch Điện Biên Phủ đến toàn thắng.'],
  ['dr-su-41', 'Lịch sử', 'Việt Nam gia nhập Liên Hợp Quốc', 'Dễ', 'Việt Nam chính thức trở thành thành viên thứ 149 của tổ chức Liên Hợp Quốc vào năm nào?', ['Năm 1977 (ngày 20/9/1977)', 'Năm 1975', 'Năm 1986', 'Năm 1995'], 'A', 'Ngày 20/9/1977, tại khóa họp thứ 32 của Đại hội đồng Liên Hợp Quốc, Việt Nam chính thức được kết nạp làm thành viên thứ 149.'],
  ['dr-su-42', 'Lịch sử', 'Bình thường hóa quan hệ Việt – Mỹ', 'TB', 'Việt Nam và Hoa Kỳ chính thức tuyên bố bình thường hóa và thiết lập quan hệ ngoại giao vào năm nào?', ['Năm 1995 (tháng 7/1995)', 'Năm 1973', 'Năm 1986', 'Năm 2000'], 'A', 'Tháng 7/1995, Việt Nam và Hoa Kỳ chính thức bình thường hóa quan hệ ngoại giao và đến năm 2023 nâng cấp lên Đối tác chiến lược toàn diện.'],
  ['dr-su-43', 'Lịch sử', 'UNESCO vinh danh Chủ tịch Hồ Chí Minh', 'Dễ', 'Năm 1987, tổ chức UNESCO đã ra Nghị quyết vinh danh Chủ tịch Hồ Chí Minh là:', ['Anh hùng giải phóng dân tộc và Nhà văn hóa kiệt xuất của Việt Nam', 'Nhà ngoại giao lỗi lạc nhất thế kỷ XIX', 'Tổng Tư lệnh tối cao của phong trào Không liên kết', 'Người sáng lập tổ chức ASEAN'], 'A', 'Nghị quyết 24C/18.65 của UNESCO (1987) tôn vinh Chủ tịch Hồ Chí Minh là "Anh hùng giải phóng dân tộc và Nhà văn hóa kiệt xuất của Việt Nam".'],
  ['dr-su-44', 'Lịch sử', 'Phương châm đối ngoại thời kỳ Đổi mới', 'TB', 'Chủ trương đối ngoại xuyên suốt của Việt Nam trong thời kỳ Đổi mới và hội nhập quốc tế là:', ['Độc lập, tự chủ, hòa bình, hữu nghị, hợp tác và phát triển; đa phương hóa, đa dạng hóa quan hệ đối ngoại', 'Chỉ thiết lập quan hệ với các nước trong khu vực Đông Nam Á', 'Tham gia các liên minh quân sự để đối trọng với các nước lớn', 'Ưu tiên đối ngoại chính trị, hạn chế hợp tác kinh tế'], 'A', 'Việt Nam kiên trì đường lối đối ngoại độc lập, tự chủ, đa phương hóa, đa dạng hóa, là bạn, là đối tác tin cậy và thành viên có trách nhiệm của cộng đồng quốc tế.'],
  ['dr-su-45', 'Lịch sử', 'Tầm nhìn Cộng đồng ASEAN sau 2015', 'TB', 'Văn kiện định hướng phát triển tiếp theo của Cộng đồng ASEAN được thông qua tại Kuala Lumpur (2015) có tên là:', ['Tầm nhìn Cộng đồng ASEAN 2025 ("Cùng vững vàng tiến bước")', 'Tuyên bố Hòa hợp ASEAN I', 'Kế hoạch Colombo', 'Hiệp định Thương mại tự do Bắc Mỹ'], 'A', 'Cùng với Tuyên bố Kuala Lumpur thành lập Cộng đồng ASEAN (2015), các nhà lãnh đạo đã thông qua "Tầm nhìn Cộng đồng ASEAN 2025".'],
  ['dr-su-46', 'Lịch sử', 'Tổng tuyển cử đầu tiên (6/1/1946)', 'Dễ', 'Sự kiện lịch sử trọng đại diễn ra vào ngày 6/1/1946 trên toàn lãnh thổ nước Việt Nam Dân chủ Cộng hòa là:', ['Cuộc Tổng tuyển cử bầu Quốc hội khóa I trong cả nước', 'Bác Hồ đọc Tuyên ngôn Độc lập', 'Toàn quốc kháng chiến bùng nổ', 'Chiến dịch Việt Bắc mở màn'], 'A', 'Ngày 6/1/1946, hơn 90% cử tri cả nước đi bỏ phiếu bầu ra 333 đại biểu Quốc hội khóa I, củng cố tính hợp hiến hợp pháp của Nhà nước.'],
  ['dr-su-47', 'Lịch sử', 'Chiến dịch Hồ Chí Minh (4/1975)', 'Dễ', 'Vào lúc 11 giờ 30 phút ngày 30/4/1975, lá cờ cách mạng tung bay trên nóc Dinh Độc Lập (Sài Gòn) đánh dấu:', ['Chiến dịch Hồ Chí Minh toàn thắng, miền Nam hoàn toàn giải phóng, đất nước thống nhất', 'Mở màn cuộc Tổng tiến công Xuân 1975', 'Bắt đầu đàm phán Hiệp định Paris', 'Kết thúc cuộc kháng chiến chống thực dân Pháp'], 'A', 'Trưa 30/4/1975, Tổng thống Dương Văn Minh tuyên bố đầu hàng không điều kiện, Chiến dịch Hồ Chí Minh toàn thắng.'],
  ['dr-su-48', 'Lịch sử', 'Đường Trường Sơn – Đường Hồ Chí Minh', 'TB', 'Tuyến chi viện chiến lược huyền thoại nối liền hậu phương lớn miền Bắc với tiền tuyến lớn miền Nam (thành lập ngày 19/5/1959, Đoàn 559) là:', ['Đường Trường Sơn (Đường Hồ Chí Minh trên bộ) và Đường Hồ Chí Minh trên biển (Đoàn 759)', 'Tuyến đường sắt Bắc – Nam xuyên Việt', 'Tuyến Quốc lộ 1A ven biển', 'Hành lang kinh tế Đông – Tây'], 'A', 'Đoàn 559 (mở đường Trường Sơn trên bộ) và Đoàn 759 (Đoàn tàu không số trên biển) là tuyến huyết mạch chi viện sức người, sức của cho miền Nam.'],
  ['dr-su-49', 'Lịch sử', 'Hậu phương miền Bắc (1954–1975)', 'TB', 'Phong trào thi đua yêu nước sôi nổi của thanh niên miền Bắc trong những năm kháng chiến chống Mỹ cứu nước là:', ['Phong trào "Ba sẵn sàng"', 'Phong trào "Ba đảm đang" (của phụ nữ)', 'Phong trào "Đồng khởi"', 'Phong trào "Phá ấp chiến lược"'], 'A', 'Thanh niên miền Bắc có phong trào "Ba sẵn sàng", thanh niên miền Nam có "Năm xung phong", phụ nữ miền Bắc có "Ba đảm đang".'],
  ['dr-su-50', 'Lịch sử', 'Chiến tranh lạnh (1947–1989)', 'TB', 'Sự kiện được xem là mở đầu cho "Chiến tranh lạnh" giữa hai phe tư bản chủ nghĩa và xã hội chủ nghĩa là:', ['Thông điệp của Tổng thống Mỹ Truman tại Quốc hội Mỹ (tháng 3/1947)', 'Sự thành lập khối quân sự NATO (1949)', 'Sự ra đời của Kế hoạch Marshall (6/1947)', 'Cuộc khủng hoảng tên lửa ở Cuba (1962)'], 'A', 'Học thuyết Truman (12/3/1947) công khai chủ trương chống Liên Xô và phong trào cộng sản, khởi đầu Chiến tranh lạnh.']
];

  function rotateOptionsDeterministically(opts, origAnsKey, seedIdx) {
    const keys = ['A', 'B', 'C', 'D'];
    const origIdx = Math.max(0, keys.indexOf(String(origAnsKey || 'A').toUpperCase()));
    const shift = seedIdx % 4;
    if (shift === 0) return { options: opts.slice(), answer: keys[origIdx] };
    const newOpts = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      newOpts[(i + shift) % 4] = opts[i];
    }
    return { options: newOpts, answer: keys[(origIdx + shift) % 4] };
  }

  const EXTRA_DRILLS = RAW_DRILLS.map(([id, subject, topic, diff, text, opts, ans, explanation], idx) => {
    const rot = rotateOptionsDeterministically(opts, ans, idx);
    return {
      id,
      subject,
      topic,
      diff,
      text,
      options: rot.options,
      optionKeys: ['A', 'B', 'C', 'D'],
      answer: rot.answer,
      explanation
    };
  });

  // Generate 60 structured Chemistry & Periodic Table questions from the 118 verified IUPAC elements
  const KEY_PT_Z = [1, 2, 3, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 25, 26, 28, 29, 30, 35, 47, 53, 56, 74, 79];
  const PERIODIC_DRILLS = [];
  KEY_PT_Z.forEach((z, idx) => {
    const el = ELEMENT_BY_Z.get(z);
    if (!el) return;
    const distractors = [
      ELEMENT_BY_Z.get(((z + 3) % 118) + 1),
      ELEMENT_BY_Z.get(((z + 8) % 118) + 1),
      ELEMENT_BY_Z.get(((z + 15) % 118) + 1)
    ].filter(Boolean);
    if (distractors.length < 3) return;

    const rot1 = rotateOptionsDeterministically(
      [
        `${el.config} (Chu kì ${el.period}, ${CAT_LABELS[el.cat] || el.cat})`,
        `${distractors[0].config} (Chu kì ${distractors[0].period}, ${CAT_LABELS[distractors[0].cat] || distractors[0].cat})`,
        `${distractors[1].config} (Chu kì ${distractors[1].period}, ${CAT_LABELS[distractors[1].cat] || distractors[1].cat})`,
        `${distractors[2].config} (Chu kì ${distractors[2].period}, ${CAT_LABELS[distractors[2].cat] || distractors[2].cat})`
      ],
      'A',
      idx + 1
    );
    PERIODIC_DRILLS.push({
      id: `pt-cfg-${z}`,
      subject: 'Hóa học',
      topic: 'Bảng tuần hoàn 118 nguyên tố IUPAC',
      diff: z <= 20 ? 'Dễ' : 'TB',
      text: `Nguyên tố ${el.name} (kí hiệu ${el.sym}, Z = ${el.z}) có cấu hình electron và phân loại chuẩn là:`,
      options: rot1.options,
      optionKeys: ['A', 'B', 'C', 'D'],
      answer: rot1.answer,
      explanation: `${el.name} (Z=${el.z}, NTK=${el.mass}) thuộc Chu kì ${el.period}, nhóm ${CAT_LABELS[el.cat] || el.cat}, cấu hình e: ${el.config}.`
    });

    const rot2 = rotateOptionsDeterministically(
      [
        `${el.sym} — ${el.name} (Z = ${el.z})`,
        `${distractors[0].sym} — ${distractors[0].name} (Z = ${distractors[0].z})`,
        `${distractors[1].sym} — ${distractors[1].name} (Z = ${distractors[1].z})`,
        `${distractors[2].sym} — ${distractors[2].name} (Z = ${distractors[2].z})`
      ],
      'A',
      idx + 2
    );
    PERIODIC_DRILLS.push({
      id: `pt-tip-${z}`,
      subject: 'Hóa học',
      topic: 'Ứng dụng & Nhận biết Nguyên tố',
      diff: z <= 26 ? 'TB' : 'Khó',
      text: `Nguyên tố hóa học nào sau đây có đặc điểm/ứng dụng trọng tâm: "${el.tip}"?`,
      options: rot2.options,
      optionKeys: ['A', 'B', 'C', 'D'],
      answer: rot2.answer,
      explanation: `Đặc điểm "${el.tip}" là dấu hiệu nhận biết trọng tâm của nguyên tố ${el.name} (${el.sym}, Z=${el.z}).`
    });
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
    practiceCount: 10,
    journeyCount: 10,
    seenMap: null,
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

  function mapCourseToSubject(course) {
    const raw = `${course?.id || ''} ${course?.shortName || ''} ${course?.name || ''}`.toLowerCase();
    if (raw.includes('math') || raw.includes('toán') || raw.includes('toan')) return 'Toán';
    if (raw.includes('phys') || raw.includes('vật lí') || raw.includes('vat li') || raw.includes('lí')) return 'Vật lí';
    if (raw.includes('chem') || raw.includes('hóa') || raw.includes('hoa')) return 'Hóa học';
    if (raw.includes('bio') || raw.includes('sinh')) return 'Sinh học';
    if (raw.includes('eng') || raw.includes('anh')) return 'Tiếng Anh';
    if (raw.includes('hist') || raw.includes('sử') || raw.includes('su')) return 'Lịch sử';
    return 'Tổng hợp';
  }

  // Extract unified 600+ question pool from EXTRA_DRILLS (285) + PERIODIC_DRILLS (60) + PK9_CATALOG (252) + PK9_SEED_EXAMS (76)
  function buildQuestionPool() {
    const out = [];
    const seenIds = new Set();
    const seenTexts = new Set();

    function pushUnique(q) {
      if (!q || !q.id || !q.text || !Array.isArray(q.options) || q.options.length < 2) return;
      const idKey = String(q.id).trim();
      const txtKey = String(q.text).trim().toLowerCase();
      if (seenIds.has(idKey) || seenTexts.has(txtKey)) return;
      seenIds.add(idKey);
      seenTexts.add(txtKey);
      out.push(q);
    }

    for (const q of EXTRA_DRILLS) pushUnique(q);
    for (const q of PERIODIC_DRILLS) pushUnique(q);

    // Harvest 252 topic exercises from window.PK9_CATALOG (pk9-curriculum.js)
    const catalogCourses = Array.isArray(window.PK9_CATALOG) ? window.PK9_CATALOG : [];
    let catIdx = 0;
    for (const course of catalogCourses) {
      const sName = mapCourseToSubject(course);
      for (const ch of (course.chapters || [])) {
        for (const tp of (ch.topics || [])) {
          for (const ex of (tp.exercises || [])) {
            if (!Array.isArray(ex.options) || ex.options.length < 2) continue;
            const rawQ = String(ex.question || ex.text || '').replace(/^Câu\s*\d+\s*[:.]\s*/i, '').trim();
            if (!rawQ) continue;
            const cIdx = Number.isInteger(ex.correct) ? ex.correct : 0;
            const ansLetter = ['A', 'B', 'C', 'D'][cIdx] || 'A';
            const rot = ex.options.length === 4
              ? rotateOptionsDeterministically(ex.options.map(String), ansLetter, catIdx)
              : { options: ex.options.map(String), answer: ansLetter };
            const diffs = ['Dễ', 'TB', 'Khó', 'Siêu khó'];
            pushUnique({
              id: `cat-${course.id || 'c'}-${tp.id || 't'}-${ex.id || catIdx}`,
              subject: sName,
              topic: tp.title || ch.title || course.shortName || 'Chuyên đề THPT',
              diff: diffs[catIdx % 4],
              text: rawQ,
              options: rot.options,
              optionKeys: rot.options.map((_, i) => ['A', 'B', 'C', 'D'][i] || String(i + 1)),
              answer: rot.answer,
              explanation: ex.solution || ex.explanation || 'Xem lại lý thuyết và ví dụ minh họa trong bài giảng chuyên đề.'
            });
            catIdx++;
          }
        }
      }
    }

    // Harvest MCQ questions from PK9_SEED_EXAMS if present
    const seedExams = Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS : [];
    for (const ex of seedExams) {
      const sName = SUBJECT_MAP[String(ex.subject || '').toLowerCase()] || ex.subject || 'Tổng hợp';
      for (const q of (ex.questions || [])) {
        if (String(q.type || 'mcq').toLowerCase() !== 'mcq' || !Array.isArray(q.options) || q.options.length < 2) continue;
        const nNum = Number(q.number || 1);
        const diff = nNum <= 4 ? 'Dễ' : nNum <= 8 ? 'TB' : nNum <= 11 ? 'Khó' : 'Siêu khó';
        pushUnique({
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

  // Unbiased Fisher-Yates shuffle
  function shuffleArray(arr) {
    const copy = Array.isArray(arr) ? arr.slice() : [];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // Shuffle 4 options per run so students solve by knowledge rather than memorizing option letter positions
  function prepareQuestionForRun(q) {
    if (!q || !Array.isArray(q.options) || q.options.length !== 4) return { ...q };
    const hasPositionalRef = q.options.some(opt => /cả\s+[ab]|tất cả\s+đều|a\s+và\s+b/i.test(String(opt || '')));
    if (hasPositionalRef) return { ...q, options: q.options.slice(), optionKeys: ['A', 'B', 'C', 'D'] };
    const keys = q.optionKeys || ['A', 'B', 'C', 'D'];
    const ansUpper = String(q.answer || 'A').toUpperCase();
    const pairs = q.options.map((text, idx) => ({
      text,
      isCorrect: String(keys[idx] || ['A', 'B', 'C', 'D'][idx]).toUpperCase() === ansUpper
    }));
    const shuffled = shuffleArray(pairs);
    const newCorrectIdx = Math.max(0, shuffled.findIndex(p => p.isCorrect));
    return {
      ...q,
      options: shuffled.map(p => p.text),
      optionKeys: ['A', 'B', 'C', 'D'],
      answer: ['A', 'B', 'C', 'D'][newCorrectIdx]
    };
  }

  function ensureSeenMap() {
    if (RPG_UI.seenMap && typeof RPG_UI.seenMap === 'object') return RPG_UI.seenMap;
    try {
      const raw = JSON.parse(localStorage.getItem('pk9_rpg_seen_qids_v1') || '{}');
      if (raw && typeof raw === 'object') {
        RPG_UI.seenMap = raw;
        return RPG_UI.seenMap;
      }
    } catch {}
    RPG_UI.seenMap = {};
    return RPG_UI.seenMap;
  }

  function persistSeenMap() {
    try {
      if (RPG_UI.seenMap) localStorage.setItem('pk9_rpg_seen_qids_v1', JSON.stringify(RPG_UI.seenMap));
    } catch {}
  }

  function getSeenIdsForScope(scopeKey) {
    const map = ensureSeenMap();
    const arr = map[scopeKey];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  }

  function resetSeenQuestions(scopeKey = 'all') {
    const map = ensureSeenMap();
    if (!scopeKey || scopeKey === 'all') {
      RPG_UI.seenMap = {};
    } else {
      delete map[scopeKey];
    }
    persistSeenMap();
  }

  // Unseen-First Fisher-Yates deck selector: guarantees 0% repeats across consecutive runs until the entire pool is exhausted
  function selectNonRepeatingQuestions(candidates, count, scopeKey = 'default') {
    if (!Array.isArray(candidates) || !candidates.length) return [];
    const targetCount = Math.max(1, Math.min(Number(count) || 10, candidates.length));
    const seenSet = getSeenIdsForScope(scopeKey);
    const unseen = [];
    const seen = [];
    for (const q of candidates) {
      if (seenSet.has(String(q.id))) seen.push(q);
      else unseen.push(q);
    }

    const shuffledUnseen = shuffleArray(unseen);
    let picked = [];
    if (shuffledUnseen.length >= targetCount) {
      picked = shuffledUnseen.slice(0, targetCount);
      for (const q of picked) seenSet.add(String(q.id));
    } else {
      picked = shuffledUnseen.slice();
      const needed = targetCount - picked.length;
      const freshSeenPool = shuffleArray(seen);
      const topUp = freshSeenPool.slice(0, needed);
      picked = picked.concat(topUp);
      seenSet.clear();
      for (const q of picked) seenSet.add(String(q.id));
    }

    const map = ensureSeenMap();
    map[scopeKey] = Array.from(seenSet).slice(-800);
    persistSeenMap();
    return picked.map(prepareQuestionForRun);
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

  function renderWeeklyScheduleStrip(rpg) {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const dayOfWeek = vnNow.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const checkedToday = Boolean(rpg.checkin?.checked_today);
    const streak = Math.max(0, Number(rpg.checkin?.streak || 0));
    const dueCount = Number(rpg.srs?.due_count || 0);
    const missions = Array.isArray(rpg.missions) ? rpg.missions : [];
    const doneMissions = missions.filter(m => m.completed).length;
    const totalMissions = missions.length || 4;

    const daysHtml = labels.map((lb, idx) => {
      const d = new Date(vnNow.getTime() + (mondayOffset + idx) * 86400000);
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const diffFromToday = todayIdx - idx;
      let status = 'upcoming';
      let icon = '•';
      if (idx === todayIdx) {
        status = checkedToday ? 'done today' : 'today';
        icon = checkedToday ? '✓' : '🔥';
      } else if (diffFromToday > 0) {
        const coveredByStreak = checkedToday ? diffFromToday < streak : diffFromToday <= streak;
        status = coveredByStreak ? 'done' : 'makeup';
        icon = coveredByStreak ? '✓' : '!';
      }
      return `
        <div class="pk9-week-day ${status}" title="${lb} (${dd}/${mm})">
          <span class="pk9-week-day-lb">${lb}</span>
          <span class="pk9-week-day-num">${dd}/${mm}</span>
          <span class="pk9-week-day-dot">${icon}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="pk9-weekly-schedule">
        <div class="pk9-weekly-head">
          <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
            <strong style="font-size:0.84rem;color:var(--pk9-text);">📅 Lịch Của Em • Chuỗi ${streak} Ngày</strong>
            <span class="pk9-badge pk9-badge-subj" style="font-size:0.7rem;">Nhiệm vụ ngày: ${doneMissions}/${totalMissions}</span>
            ${dueCount > 0 ? `<span class="pk9-badge" style="background:rgba(239,68,68,0.14);color:#dc2626;font-size:0.7rem;">⏰ Cần ôn bù: ${dueCount} câu SRS</span>` : `<span class="pk9-badge pk9-badge-verified" style="font-size:0.7rem;">✓ Không nợ bài SRS</span>`}
          </div>
          <div class="pk9-weekly-QuickActions">
            ${!checkedToday ? `<button type="button" class="pk9-admin-btn-xs" data-rpg-checkin="1" style="background:#10b981;color:#fff;border:none;">🎁 Điểm danh (+30🪙)</button>` : ''}
            ${dueCount > 0 ? `<button type="button" class="pk9-admin-btn-xs" data-nav-tab="missions" style="background:#ef4444;color:#fff;border:none;">📕 Ôn bù ${dueCount} câu ›</button>` : ''}
            <button type="button" class="pk9-admin-btn-xs" data-nav-tab="missions">⚡ Làm nhiệm vụ (${doneMissions}/${totalMissions}) ›</button>
          </div>
        </div>
        <div class="pk9-weekly-days-grid">
          ${daysHtml}
        </div>
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
        ${renderWeeklyScheduleStrip(rpg)}
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
                  ${[5, 10, 15, 20, 30].map(n => `<button type="button" class="pk9-exam-chip ${RPG_UI.practiceCount === n ? 'active' : ''}" data-pr-count="${n}">${n} câu</button>`).join('')}
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
    const allPool = buildQuestionPool();
    const jCount = Number(RPG_UI.journeyCount || 10);

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <div style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.26rem 0.75rem;border-radius:999px;background:rgba(16,185,129,0.22);font-size:0.74rem;font-weight:800;margin-bottom:0.55rem;">
                📚 KHO ĐỀ ĐẢO MỞ RỘNG: ${allPool.length}+ CÂU HỎI • CHỐNG LẶP THÔNG MINH
              </div>
              <h2 style="margin:0 0 0.45rem;font-size:1.5rem;font-weight:900;">🗺️ Game Hành Trình Vượt Đảo Tri Thức & Cờ Vùng Tuần 🚩</h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.9rem;">
                Kho câu hỏi <b>${allPool.length} câu</b> tự động ưu tiên chia các câu <b>chưa từng gặp</b> và xáo trộn vị trí đáp án mỗi lượt chơi! Đạt 3⭐ lần đầu tặng +1 Kim cương, điểm cao nhất tuần giữ <b>Cờ Vùng Tuần 🚩</b>.
              </p>
            </div>
            <div>${renderCurrencyStrip(rpg)}</div>
          </div>
        </div>

        <div class="pk9-card" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.75rem;padding:0.85rem 1rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span style="font-size:0.82rem;font-weight:800;color:var(--pk9-text);">🎯 Số câu mỗi lượt Vượt Đảo:</span>
            <div class="pk9-exam-tabs">
              ${[
                { n: 10, lb: '⚡ 10 câu (Nhanh)' },
                { n: 15, lb: '⚔️ 15 câu (Tiêu chuẩn)' },
                { n: 20, lb: '🔥 20 câu (Chinh phục)' },
                { n: 30, lb: '👑 30 câu (Marathon)' },
                { n: 50, lb: '🏆 50 câu (Siêu cấp)' }
              ].map(m => `<button type="button" class="pk9-exam-chip ${jCount === m.n ? 'active' : ''}" data-jr-count="${m.n}">${m.lb}</button>`).join('')}
            </div>
          </div>
          <button type="button" class="pk9-btn-exam-ghost" data-jr-reset-seen="all" style="padding:0.38rem 0.75rem;font-size:0.76rem;" title="Xóa lịch sử câu đã gặp để trộn lại toàn bộ kho câu">
            🔄 Trộn mới lịch sử câu (${allPool.length} câu)
          </button>
        </div>

        <div class="pk9-journey-layout">
          <div class="pk9-shop-grid">
            ${ISLANDS.map(isl => {
              const st = jProg[isl.id] || { stars: 0, best_score: 0, plays: 0 };
              const starsStr = '⭐'.repeat(st.stars || 0) + '☆'.repeat(3 - (st.stars || 0));
              const islPool = isl.subject === 'Tất cả' ? allPool : allPool.filter(q => q.subject === isl.subject);
              const seenCount = Math.min(islPool.length, getSeenIdsForScope(`journey:${isl.id}`).size);
              const runCount = Math.min(jCount, islPool.length);
              return `
                <article class="pk9-shop-card">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:1.9rem;">${isl.icon}</span>
                    <span style="font-size:0.9rem;letter-spacing:2px;">${starsStr}</span>
                  </div>
                  <div style="font-weight:900;font-size:0.96rem;margin-top:0.45rem;">${esc(isl.name)}</div>
                  <div style="font-size:0.78rem;color:var(--pk9-text-muted);flex:1;margin:0.25rem 0 0.5rem;">${esc(isl.desc)}</div>
                  <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.45rem;">
                    <span class="pk9-badge pk9-badge-subj" style="font-size:0.7rem;">📚 Kho: ${islPool.length} câu</span>
                    <span class="pk9-badge pk9-badge-code" style="font-size:0.7rem;">✨ Đã mở: ${seenCount}/${islPool.length}</span>
                  </div>
                  <div style="font-size:0.75rem;color:var(--pk9-text-muted);margin-bottom:0.55rem;">
                    Kỉ lục: <b>${st.best_score || 0}</b> đ • Lượt chơi: ${st.plays || 0}
                  </div>
                  ${user ? `
                    <button type="button" class="pk9-btn-exam-primary" data-start-island="${esc(isl.id)}" data-island-subj="${esc(isl.subject)}" style="width:100%;padding:0.48rem;">
                      ⛵ Vượt Đảo Ngay (${runCount} câu)
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
      if (!chosen.length) {
        chosen = selectNonRepeatingQuestions(pool, 10, 'srs:fallback');
      } else {
        chosen = shuffleArray(chosen).slice(0, 15).map(prepareQuestionForRun);
      }
    } else if (mode === 'journey') {
      const subj = opts.subject || 'Tất cả';
      const islandId = opts.islandId || `island-${subj}`;
      const runCount = Math.max(1, Number(opts.count || RPG_UI.journeyCount || 10));
      const filtered = subj === 'Tất cả' ? pool : pool.filter(q => q.subject === subj);
      chosen = selectNonRepeatingQuestions(filtered, runCount, `journey:${islandId}`);
    } else {
      const filtered = pool.filter(q =>
        (RPG_UI.practiceSubj === 'Tất cả' || q.subject === RPG_UI.practiceSubj) &&
        (RPG_UI.practiceDiff === 'Tất cả' || q.diff === RPG_UI.practiceDiff)
      );
      const scopeKey = `practice:${RPG_UI.practiceSubj}:${RPG_UI.practiceDiff}`;
      chosen = selectNonRepeatingQuestions(filtered, RPG_UI.practiceCount, scopeKey);
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
      if (prCount) { RPG_UI.practiceCount = Number(prCount.getAttribute('data-pr-count')) || 10; renderMissionsTab(); return; }
      const jrCount = e.target.closest('[data-jr-count]');
      if (jrCount) { RPG_UI.journeyCount = Number(jrCount.getAttribute('data-jr-count')) || 10; renderJourneyTab(); return; }
      const jrReset = e.target.closest('[data-jr-reset-seen]');
      if (jrReset) { resetSeenQuestions(jrReset.getAttribute('data-jr-reset-seen') || 'all'); toast('🔄 Đã làm mới lịch sử câu hỏi Vượt Đảo!', 'info'); renderJourneyTab(); return; }

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
          await rpgPost('rpg-journey-submit', { island_id: sess.islandId, correct: okCount, total: sess.questions.length, time_sec: sec, results: sess.results });
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
        const q = RPG_UI.ptSearch.trim().toLowerCase();
        document.querySelectorAll('#tab-periodic [data-pt-pick]').forEach(btn => {
          const z = Number(btn.getAttribute('data-pt-pick'));
          const el = ELEMENT_BY_Z.get(z);
          if (el) {
            const match = !q || `${el.z} ${el.sym} ${el.name}`.toLowerCase().includes(q);
            btn.classList.toggle('dimmed', !match);
          }
        });
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
    ISLANDS,
    buildQuestionPool,
    selectNonRepeatingQuestions,
    resetSeenQuestions,
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
