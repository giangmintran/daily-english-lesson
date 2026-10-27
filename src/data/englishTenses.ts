export interface TenseExample {
  en: string;
  vi: string;
}

export interface EnglishTense {
  id: string;
  name: string;
  nameVi: string;
  category: 'present' | 'past' | 'future';
  categoryLabel: string;
  summaryFormula: string;
  formulas: {
    affirmative: string;
    negative: string;
    interrogative: string;
    note?: string;
  };
  usage: string[];
  signals: string[];
  examples: TenseExample[];
  tips?: string[];
}

export const ENGLISH_TENSES: EnglishTense[] = [
  // --- HIỆN TẠI (PRESENT) ---
  {
    id: 'present-simple',
    name: 'Present Simple',
    nameVi: 'Thì Hiện tại đơn',
    category: 'present',
    categoryLabel: 'Hiện tại',
    summaryFormula: 'S + V(s/es) / S + am/is/are',
    formulas: {
      affirmative: 'Động từ thường: S + V(s/es)\nTo be: S + am/is/are + O/Adj',
      negative: 'Động từ thường: S + do/does not + V_nguyên thể\nTo be: S + am/is/are not + O/Adj',
      interrogative: 'Động từ thường: Do/Does + S + V_nguyên thể?\nTo be: Am/Is/Are + S + O/Adj?',
      note: 'I/You/We/They đi với do/V_inf. He/She/It/Danh từ số ít đi với does/V(s/es).',
    },
    usage: [
      'Diễn tả thói quen hoặc hành động lặp đi lặp lại ở hiện tại.',
      'Diễn tả chân lý, sự thật hiển nhiên (quy luật tự nhiên, khoa học).',
      'Lịch trình tàu xe, máy bay, lịch học, thời gian biểu cố định.',
      'Nói về sở thích, nguồn gốc, khả năng ở hiện tại.',
    ],
    signals: [
      'always',
      'usually',
      'often',
      'sometimes',
      'rarely',
      'seldom',
      'never',
      'every day / week / month / year',
      'once / twice a week',
      'in the morning / evening',
    ],
    examples: [
      {
        en: 'She drinks coffee every morning before going to work.',
        vi: 'Cô ấy uống cà phê mỗi buổi sáng trước khi đi làm.',
      },
      {
        en: 'The sun rises in the east and sets in the west.',
        vi: 'Mặt trời mọc ở hướng đông và lặn ở hướng tây.',
      },
      {
        en: 'The train departs at 7:30 tomorrow morning.',
        vi: 'Chuyến tàu khởi hành lúc 7h30 sáng mai.',
      },
    ],
    tips: [
      'Thêm "es" khi động từ kết thúc bằng: -o, -s, -ch, -x, -sh, -z (ví dụ: goes, watches, washes, fixes).',
      'Động từ tận cùng bằng "phụ âm + y" thì đổi thành "-ies" (ví dụ: study -> studies, fly -> flies).',
      'Động từ tận cùng bằng "nguyên âm + y" thì chỉ thêm "s" (ví dụ: play -> plays).',
    ],
  },
  {
    id: 'present-continuous',
    name: 'Present Continuous',
    nameVi: 'Thì Hiện tại tiếp diễn',
    category: 'present',
    categoryLabel: 'Hiện tại',
    summaryFormula: 'S + am/is/are + V-ing',
    formulas: {
      affirmative: 'S + am/is/are + V-ing',
      negative: 'S + am/is/are + not + V-ing',
      interrogative: 'Am/Is/Are + S + V-ing?',
      note: 'I + am; He/She/It + is; You/We/They + are',
    },
    usage: [
      'Diễn tả hành động đang xảy ra ngay tại thời điểm nói.',
      'Diễn tả hành động có tính tạm thời xung quanh thời điểm nói (không nhất thiết đang xảy ra ngay lúc nói).',
      'Kế hoạch chắc chắn sẽ thực hiện trong tương lai gần (đã có chuẩn bị/sắp xếp từ trước).',
      'Dùng với "always" để phàn nàn về một thói quen xấu gây khó chịu.',
    ],
    signals: [
      'now',
      'right now',
      'at the moment',
      'at present',
      'currently',
      'Look!',
      'Listen!',
      'Be quiet!',
      'Keep silent!',
      'Watch out!',
      'these days',
      'this week / month',
    ],
    examples: [
      {
        en: 'Please be quiet! The baby is sleeping.',
        vi: 'Xin hãy giữ yên lặng! Em bé đang ngủ.',
      },
      {
        en: 'I am currently studying for the IELTS exam.',
        vi: 'Hiện tại tôi đang ôn luyện cho kỳ thi IELTS.',
      },
      {
        en: 'He is always forgetting his house keys!',
        vi: 'Anh ta lúc nào cũng quên chìa khóa nhà! (phàn nàn)',
      },
    ],
    tips: [
      'Các ĐỘNG TỪ TRẠNG THÁI (Stative verbs) KHÔNG dùng ở thì tiếp diễn: know, believe, understand, want, need, like, love, hate, see, hear, belong to, remember...',
      'Gấp đôi phụ âm cuối trước khi thêm -ing nếu từ có 1 âm tiết, tận cùng là "1 phụ âm - 1 nguyên âm - 1 phụ âm" (run -> running, sit -> sitting).',
    ],
  },
  {
    id: 'present-perfect',
    name: 'Present Perfect',
    nameVi: 'Thì Hiện tại hoàn thành',
    category: 'present',
    categoryLabel: 'Hiện tại',
    summaryFormula: 'S + have/has + V3/ed',
    formulas: {
      affirmative: 'S + have/has + V3/ed',
      negative: 'S + have/has not (haven\'t / hasn\'t) + V3/ed',
      interrogative: 'Have/Has + S + V3/ed?',
      note: 'I/You/We/They + have | He/She/It + has',
    },
    usage: [
      'Hành động xảy ra trong quá khứ nhưng kết quả vẫn còn liên quan hoặc thấy rõ ở hiện tại.',
      'Hành động bắt đầu trong quá khứ và vẫn còn tiếp diễn đến hiện tại (thường đi với since/for).',
      'Kể về kinh nghiệm, trải nghiệm tính đến thời điểm hiện tại (đã từng / chưa từng làm gì).',
      'Hành động vừa mới diễn ra xong (đi kèm just, recently).',
    ],
    signals: [
      'already',
      'yet (dùng trong câu phủ định & nghi vấn)',
      'just',
      'recently',
      'lately',
      'ever',
      'never',
      'since + mốc thời gian (since 2018, since yesterday)',
      'for + khoảng thời gian (for 3 years, for a long time)',
      'so far / up to now / until now',
      'This is the first time / second time...',
    ],
    examples: [
      {
        en: 'I have lost my key, so I cannot unlock the door right now.',
        vi: 'Tôi đã làm mất chìa khóa, nên hiện giờ không thể mở cửa được.',
      },
      {
        en: 'She has worked for this tech company for over five years.',
        vi: 'Cô ấy đã làm việc cho công ty công nghệ này hơn năm năm rồi.',
      },
      {
        en: 'Have you ever visited London before?',
        vi: 'Bạn đã từng đến thăm Luân Đôn trước đây chưa?',
      },
    ],
    tips: [
      'Phân biệt SINCE và FOR: SINCE + mốc thời gian bắt đầu (since 2020, since 8 AM); FOR + khoảng thời gian (for 2 days, for 5 hours).',
      'Phân biệt "have gone to" (đã đi và chưa về) và "have been to" (đã từng đến và đã về rồi).',
    ],
  },
  {
    id: 'present-perfect-continuous',
    name: 'Present Perfect Continuous',
    nameVi: 'Thì Hiện tại hoàn thành tiếp diễn',
    category: 'present',
    categoryLabel: 'Hiện tại',
    summaryFormula: 'S + have/has been + V-ing',
    formulas: {
      affirmative: 'S + have/has + been + V-ing',
      negative: 'S + have/has not + been + V-ing',
      interrogative: 'Have/Has + S + been + V-ing?',
      note: 'Nhấn mạnh tính liên tục của hành động kéo dài đến hiện tại.',
    },
    usage: [
      'Nhấn mạnh vào tính LIÊN TỤC và THỜI GIAN KÉO DÀI của hành động bắt đầu từ quá khứ và vẫn tiếp diễn.',
      'Hành động vừa mới kết thúc nhưng hậu quả/dấu vết để lại rất rõ ràng ở hiện tại.',
    ],
    signals: [
      'all day / all morning / all night',
      'since / for (khi muốn nhấn mạnh hành động liên tục không ngắt quãng)',
      'How long have you been...?',
      'lately / recently',
    ],
    examples: [
      {
        en: 'It has been raining continuously all morning; the roads are flooded.',
        vi: 'Trời đã mưa liên tục suốt cả buổi sáng; đường xá đều ngập lụt.',
      },
      {
        en: 'He is exhausted because he has been working on this code for eight hours.',
        vi: 'Anh ấy kiệt sức vì đã ngồi viết mã liên tục suốt 8 tiếng đồng hồ.',
      },
    ],
    tips: [
      'Hiện tại hoàn thành nhấn mạnh KẾT QUẢ hoặc SỐ LƯỢNG (I have written 3 letters).',
      'Hiện tại hoàn thành tiếp diễn nhấn mạnh QUÁ TRÌNH và TÍNH LIÊN TỤC (I have been writing letters all day).',
    ],
  },

  // --- QUÁ KHỨ (PAST) ---
  {
    id: 'past-simple',
    name: 'Past Simple',
    nameVi: 'Thì Quá khứ đơn',
    category: 'past',
    categoryLabel: 'Quá khứ',
    summaryFormula: 'S + V2/ed / S + was/were',
    formulas: {
      affirmative: 'Động từ thường: S + V2/ed\nTo be: S + was/were + O/Adj',
      negative: 'Động từ thường: S + did not (didn\'t) + V_nguyên thể\nTo be: S + was/were not + O/Adj',
      interrogative: 'Động từ thường: Did + S + V_nguyên thể?\nTo be: Was/Were + S + O/Adj?',
      note: 'I/He/She/It đi với was; You/We/They đi với were.',
    },
    usage: [
      'Diễn tả hành động đã xảy ra và ĐÃ KẾT THÚC hoàn toàn trong quá khứ tại một thời điểm xác định.',
      'Diễn tả một chuỗi các hành động liên tiếp xảy ra trong quá khứ (kể chuyện).',
      'Thói quen trong quá khứ mà nay không còn nữa (có thể dùng used to + V).',
    ],
    signals: [
      'yesterday',
      'last night / week / month / year',
      'ago (2 hours ago, 3 days ago)',
      'in + năm trong quá khứ (in 1995, in 2021)',
      'when I was a child / when I was young',
      'the other day',
    ],
    examples: [
      {
        en: 'I visited my grandparents in the countryside last weekend.',
        vi: 'Tôi đã về thăm ông bà ở quê vào cuối tuần trước.',
      },
      {
        en: 'He woke up, brushed his teeth, and left the apartment.',
        vi: 'Anh ấy thức dậy, đánh răng rồi rời khỏi căn hộ.',
      },
      {
        en: 'Did you finish the assignment yesterday?',
        vi: 'Bạn đã hoàn thành bài tập ngày hôm qua chưa?',
      },
    ],
    tips: [
      'Khi đã dùng trợ động từ "did" hoặc "didn\'t", động từ chính LUÔN trở về dạng nguyên thể (V_inf).',
      'Cần học thuộc bảng Động từ bất quy tắc (Irregular Verbs) cột 2 (V2): go -> went, see -> saw, buy -> bought...',
    ],
  },
  {
    id: 'past-continuous',
    name: 'Past Continuous',
    nameVi: 'Thì Quá khứ tiếp diễn',
    category: 'past',
    categoryLabel: 'Quá khứ',
    summaryFormula: 'S + was/were + V-ing',
    formulas: {
      affirmative: 'S + was/were + V-ing',
      negative: 'S + was/were not (wasn\'t / weren\'t) + V-ing',
      interrogative: 'Was/Were + S + V-ing?',
      note: 'I/He/She/It + was; You/We/They + were',
    },
    usage: [
      'Diễn tả hành động đang diễn ra tại một thời điểm cụ thể, chính xác trong quá khứ.',
      'Một hành động ĐANG DIỄN RA trong quá khứ thì một hành động khác XEN VÀO (đang xảy ra: QK tiếp diễn; xen vào: QK đơn).',
      'Hai hành động xảy ra song song đồng thời cùng một lúc trong quá khứ (dùng với While).',
    ],
    signals: [
      'at + giờ + thời gian trong quá khứ (at 8 PM last night)',
      'at this time yesterday / last week',
      'when (khi một hành động xen vào)',
      'while / as (trong khi...)',
      'all day yesterday',
    ],
    examples: [
      {
        en: 'At 9 PM yesterday, I was watching an English documentary.',
        vi: 'Vào lúc 9 giờ tối qua, tôi đang xem một bộ phim tài liệu tiếng Anh.',
      },
      {
        en: 'While we were having dinner, the electricity went out.',
        vi: 'Trong khi chúng tôi đang ăn tối thì đột nhiên bị cúp điện.',
      },
      {
        en: 'While my mother was cooking, my father was reading the newspaper.',
        vi: 'Trong khi mẹ tôi đang nấu ăn thì bố tôi đang đọc báo.',
      },
    ],
    tips: [
      'Quy tắc vàng phối thì: While + S + was/were + V-ing (hành động dài), S + V2/ed (hành động ngắn cắt ngang).',
      'When + S + V2/ed, S + was/were + V-ing.',
    ],
  },
  {
    id: 'past-perfect',
    name: 'Past Perfect',
    nameVi: 'Thì Quá khứ hoàn thành',
    category: 'past',
    categoryLabel: 'Quá khứ',
    summaryFormula: 'S + had + V3/ed',
    formulas: {
      affirmative: 'S + had + V3/ed',
      negative: 'S + had not (hadn\'t) + V3/ed',
      interrogative: 'Had + S + V3/ed?',
      note: 'Tất cả các ngôi (I/You/We/They/He/She/It) đều dùng chung "had".',
    },
    usage: [
      'Diễn tả hành động xảy ra và HOÀN THÀNH TRƯỚC một hành động khác trong quá khứ (Hành động trước: QK hoàn thành; hành động sau: QK đơn).',
      'Diễn tả hành động xảy ra trước một mốc thời gian xác định trong quá khứ.',
    ],
    signals: [
      'before + mốc quá khứ / mệnh đề QK đơn',
      'after + mệnh đề QK hoàn thành',
      'by the time + mệnh đề QK đơn',
      'as soon as',
      'by + mốc thời gian quá khứ (by 10 PM yesterday, by 2015)',
      'hardly... when / scarcely... when / no sooner... than',
    ],
    examples: [
      {
        en: 'When we arrived at the cinema, the movie had already started.',
        vi: 'Khi chúng tôi đến rạp chiếu phim, bộ phim đã bắt đầu từ trước đó rồi.',
      },
      {
        en: 'She had finished all her reports before the manager asked for them.',
        vi: 'Cô ấy đã hoàn thành toàn bộ báo cáo trước khi quản lý yêu cầu.',
      },
      {
        en: 'By the time the police arrived, the burglar had escaped.',
        vi: 'Trước khi cảnh sát tới nơi, tên trộm đã tẩu thoát.',
      },
    ],
    tips: [
      'Công thức kinh điển trong đề thi: After + S + had + V3/ed, S + V2/ed.',
      'Before / By the time + S + V2/ed, S + had + V3/ed.',
    ],
  },
  {
    id: 'past-perfect-continuous',
    name: 'Past Perfect Continuous',
    nameVi: 'Thì Quá khứ hoàn thành tiếp diễn',
    category: 'past',
    categoryLabel: 'Quá khứ',
    summaryFormula: 'S + had been + V-ing',
    formulas: {
      affirmative: 'S + had + been + V-ing',
      negative: 'S + had not + been + V-ing',
      interrogative: 'Had + S + been + V-ing?',
      note: 'Nhấn mạnh tính liên tục của hành động kéo dài đến trước 1 mốc trong quá khứ.',
    },
    usage: [
      'Nhấn mạnh vào TÍNH LIÊN TỤC của hành động đã diễn ra và kéo dài liên tục trước một hành động/mốc thời gian khác trong quá khứ.',
      'Diễn tả nguyên nhân của một kết quả cụ thể trong quá khứ.',
    ],
    signals: [
      'until then',
      'prior to that time',
      'for + khoảng thời gian (kết hợp với mốc quá khứ)',
      'before / by the time',
    ],
    examples: [
      {
        en: 'He was exhausted because he had been driving non-stop for five hours.',
        vi: 'Anh ấy kiệt sức vì đã lái xe liên tục suốt 5 tiếng đồng hồ trước đó.',
      },
      {
        en: 'They had been waiting for two hours before the flight was finally announced.',
        vi: 'Họ đã đợi suốt 2 tiếng trước khi chuyến bay cuối cùng cũng được thông báo.',
      },
    ],
    tips: [
      'So sánh: Quá khứ hoàn thành nhấn mạnh kết quả (He had written 2 emails); Quá khứ hoàn thành tiếp diễn nhấn mạnh thời gian và sự liên tục (He had been writing emails for hours).',
    ],
  },

  // --- TƯƠNG LAI (FUTURE) ---
  {
    id: 'future-simple',
    name: 'Future Simple',
    nameVi: 'Thì Tương lai đơn',
    category: 'future',
    categoryLabel: 'Tương lai',
    summaryFormula: 'S + will + V_inf',
    formulas: {
      affirmative: 'S + will + V_nguyên thể',
      negative: 'S + will not (won\'t) + V_nguyên thể',
      interrogative: 'Will + S + V_nguyên thể?',
      note: 'Dùng chung "will" cho tất cả các chủ ngữ (có thể dùng "shall" với I/We trong lời đề nghị).',
    },
    usage: [
      'Quyết định tức thì được đưa ra ngay tại thời điểm nói (không có dự định từ trước).',
      'Đưa ra dự đoán không có căn cứ rõ ràng (dựa vào quan điểm, cảm tính cá nhân).',
      'Lời hứa (promise), lời đe dọa (threat), đề nghị giúp đỡ (offer).',
    ],
    signals: [
      'tomorrow',
      'next week / month / year',
      'in + khoảng thời gian (in 5 minutes, in 2 days)',
      'soon',
      'I think / I believe / I suppose / I hope',
      'probably / perhaps / maybe',
    ],
    examples: [
      {
        en: 'It is cold outside. I will close the window.',
        vi: 'Bên ngoài lạnh quá. Tôi sẽ đi đóng cửa sổ ngay. (quyết định tức thì)',
      },
      {
        en: 'I think our team will win the championship this season.',
        vi: 'Tôi nghĩ rằng đội chúng ta sẽ giành chức vô địch mùa giải này. (dự đoán cảm tính)',
      },
      {
        en: 'Don\'t worry, I promise I will not tell anyone your secret.',
        vi: 'Đừng lo, tôi hứa sẽ không nói bí mật của bạn cho ai biết đâu.',
      },
    ],
    tips: [
      'Sau liên từ chỉ thời gian (when, as soon as, until, before, after) KHÔNG dùng "will", phải dùng HIỆN TẠI ĐƠN: I will call you when I arrive (KHÔNG dùng: when I will arrive).',
    ],
  },
  {
    id: 'near-future',
    name: 'Near Future (Be going to)',
    nameVi: 'Thì Tương lai gần',
    category: 'future',
    categoryLabel: 'Tương lai',
    summaryFormula: 'S + am/is/are going to + V_inf',
    formulas: {
      affirmative: 'S + am/is/are + going to + V_nguyên thể',
      negative: 'S + am/is/are + not + going to + V_nguyên thể',
      interrogative: 'Am/Is/Are + S + going to + V_nguyên thể?',
      note: 'Dùng to be (am/is/are) tương ứng với chủ ngữ.',
    },
    usage: [
      'Kế hoạch, dự định đã được sắp xếp hoặc quyết định từ trước thời điểm nói.',
      'Dự đoán có CĂN CỨ hoặc DẤU HIỆU RÕ RÀNG ở hiện tại.',
    ],
    signals: [
      'Look at...! (nhìn xem)',
      'planned / decided to do something',
      'intended to',
    ],
    examples: [
      {
        en: 'Look at those dark clouds! It is going to rain.',
        vi: 'Hãy nhìn những đám mây đen kia kìa! Trời sắp mưa rồi. (có căn cứ rõ ràng)',
      },
      {
        en: 'We are going to buy a new car next month; we have already saved the money.',
        vi: 'Chúng tôi dự định mua xe hơi mới vào tháng tới; chúng tôi đã để dành tiền rồi.',
      },
    ],
    tips: [
      'Phân biệt "Will" vs "Be going to":\n- Will: quyết định bộc phát ngay lúc nói, dự đoán cảm tính.\n- Be going to: kế hoạch đã dự tính trước, dự đoán có bằng chứng cụ thể trước mắt.',
    ],
  },
  {
    id: 'future-continuous',
    name: 'Future Continuous',
    nameVi: 'Thì Tương lai tiếp diễn',
    category: 'future',
    categoryLabel: 'Tương lai',
    summaryFormula: 'S + will be + V-ing',
    formulas: {
      affirmative: 'S + will + be + V-ing',
      negative: 'S + will not (won\'t) + be + V-ing',
      interrogative: 'Will + S + be + V-ing?',
      note: '"will be" giữ nguyên với mọi chủ ngữ.',
    },
    usage: [
      'Diễn tả hành động sẽ ĐANG DIỄN RA tại một thời điểm hoặc một khoảng thời gian cụ thể trong tương lai.',
      'Hành động đang diễn ra trong tương lai thì một hành động khác xen vào (hành động xen vào chia thì Hiện tại đơn).',
    ],
    signals: [
      'at this time tomorrow / next week',
      'at + giờ + thời gian tương lai (at 8 PM tomorrow evening)',
      'when + S + V(hiện tại đơn) ...',
      'during the next few days',
    ],
    examples: [
      {
        en: 'This time tomorrow, I will be flying over the Pacific Ocean.',
        vi: 'Tầm giờ này ngày mai, tôi sẽ đang bay qua Thái Bình Dương.',
      },
      {
        en: 'When you arrive at the airport, she will be waiting for you at gate 5.',
        vi: 'Khi bạn đến sân bay, cô ấy sẽ đang đợi bạn ở cửa số 5.',
      },
    ],
    tips: [
      'So sánh với Quá khứ tiếp diễn: cùng dạng thời điểm cụ thể nhưng một bên là "yesterday" (was/were V-ing) còn một bên là "tomorrow" (will be V-ing).',
    ],
  },
  {
    id: 'future-perfect',
    name: 'Future Perfect',
    nameVi: 'Thì Tương lai hoàn thành',
    category: 'future',
    categoryLabel: 'Tương lai',
    summaryFormula: 'S + will have + V3/ed',
    formulas: {
      affirmative: 'S + will + have + V3/ed',
      negative: 'S + will not (won\'t) + have + V3/ed',
      interrogative: 'Will + S + have + V3/ed?',
      note: 'Luôn dùng "will have", không chia has.',
    },
    usage: [
      'Diễn tả hành động sẽ HOÀN TẤT TRƯỚC một mốc thời gian hoặc trước một hành động khác trong tương lai.',
    ],
    signals: [
      'by + mốc thời gian tương lai (by tomorrow, by next Monday, by 2030)',
      'by the time + S + V(hiện tại đơn)',
      'by the end of this month / year',
      'before + mốc thời gian tương lai',
    ],
    examples: [
      {
        en: 'By next December, we will have graduated from university.',
        vi: 'Trước tháng 12 năm tới, chúng tôi sẽ đã tốt nghiệp đại học.',
      },
      {
        en: 'By the time you wake up, I will have finished preparing breakfast.',
        vi: 'Trước lúc bạn thức dậy, tôi sẽ đã hoàn tất việc chuẩn bị bữa sáng.',
      },
    ],
    tips: [
      'Công thức cực kỳ phổ biến trong đề thi:\nBy the time + S + V(hiện tại đơn), S + will have + V3/ed.',
      'Khác với quá khứ hoàn thành: By the time + S + V(quá khứ đơn), S + had + V3/ed.',
    ],
  },
  {
    id: 'future-perfect-continuous',
    name: 'Future Perfect Continuous',
    nameVi: 'Thì Tương lai hoàn thành tiếp diễn',
    category: 'future',
    categoryLabel: 'Tương lai',
    summaryFormula: 'S + will have been + V-ing',
    formulas: {
      affirmative: 'S + will + have + been + V-ing',
      negative: 'S + will not + have + been + V-ing',
      interrogative: 'Will + S + have + been + V-ing?',
      note: 'Dùng để nhấn mạnh độ dài liên tục kéo dài đến mốc tương lai.',
    },
    usage: [
      'Nhấn mạnh vào tính LIÊN TỤC của một hành động đã và đang xảy ra, kéo dài cho đến một mốc thời gian xác định trong tương lai.',
    ],
    signals: [
      'by the time... for [khoảng thời gian]',
      'by next month... for [khoảng thời gian]',
      'up until then',
    ],
    examples: [
      {
        en: 'By November, he will have been working at this company for exactly 10 years.',
        vi: 'Tính đến tháng 11, anh ấy sẽ đã làm việc liên tục tại công ty này đúng tròn 10 năm.',
      },
    ],
    tips: [
      'Rất ít khi dùng trong giao tiếp thông thường, nhưng thường xuất hiện trong các câu hỏi ngữ pháp phân loại học sinh khá giỏi.',
    ],
  },
];

export interface GoldenRule {
  title: string;
  formula: string;
  explanation: string;
  example: string;
}

export const GOLDEN_GRAMMAR_RULES: GoldenRule[] = [
  {
    title: 'Phối thì với WHEN (Hành động xen vào)',
    formula: 'QK Tiếp diễn + WHEN + QK Đơn',
    explanation: 'Hành động dài đang xảy ra chia Quá khứ tiếp diễn, hành động ngắn bất ngờ xen vào chia Quá khứ đơn.',
    example: 'I was watching TV when the phone rang.',
  },
  {
    title: 'Phối thì với WHILE (Hành động song song)',
    formula: 'WHILE + QK Tiếp diễn, QK Tiếp diễn',
    explanation: 'Hai hành động dài diễn ra song song cùng một lúc trong quá khứ.',
    example: 'While Jane was reading, Mark was playing video games.',
  },
  {
    title: 'Phối thì với SINCE (Hiện tại hoàn thành)',
    formula: 'S + have/has V3/ed + SINCE + S + V2/ed (hoặc mốc thời gian)',
    explanation: 'Mệnh đề chứa SINCE chia Quá khứ đơn, mệnh đề chính chia Hiện tại hoàn thành.',
    example: 'I haven’t seen him since we graduated from high school.',
  },
  {
    title: 'Phối thì với BY THE TIME (Trong Quá khứ)',
    formula: 'BY THE TIME + QK Đơn, QK Hoàn thành (had V3)',
    explanation: 'Trước khi một sự việc quá khứ xảy ra, một sự việc khác đã hoàn thành từ trước đó.',
    example: 'By the time the train arrived, they had left the station.',
  },
  {
    title: 'Phối thì với BY THE TIME (Trong Tương lai)',
    formula: 'BY THE TIME + Hiện tại Đơn, Tương lai Hoàn thành (will have V3)',
    explanation: 'Trước khi một sự việc ở tương lai diễn ra, một việc khác sẽ hoàn thành xong.',
    example: 'By the time you arrive, I will have finished cooking.',
  },
  {
    title: 'Phối thì với AFTER & BEFORE',
    formula: 'AFTER + QK Hoàn thành, QK Đơn | BEFORE + QK Đơn, QK Hoàn thành',
    explanation: 'Hành động xảy ra trước chia Quá khứ hoàn thành, xảy ra sau chia Quá khứ đơn.',
    example: 'After he had finished his work, he went straight to sleep.',
  },
  {
    title: 'Mệnh đề trạng ngữ chỉ thời gian ở Tương lai',
    formula: 'Mệnh đề chính (will + V) + WHEN / AS SOON AS / UNTIL + Hiện tại đơn',
    explanation: 'Không bao giờ dùng "will" trong mệnh đề trạng ngữ chỉ thời gian (when, after, until, as soon as).',
    example: 'I will call you as soon as I arrive home (KHÔNG dùng: will arrive).',
  },
];

