import { DailyLesson } from '../types/lesson';

export const sampleLesson: DailyLesson = {
  date: new Date().toISOString().split('T')[0],
  topic: "Deep Work, Focus & Modern Productivity",
  vocabulary: [
    {
      id: "v0",
      word: "unwind",
      phonetic: "/ˌʌnˈwaɪnd/",
      partOfSpeech: "Động từ",
      meaning: "Thư giãn, thả lỏng sau khi làm việc hoặc trải qua căng thẳng.",
      usage: "Dùng khi nói về việc nghỉ ngơi để giải tỏa căng thẳng sau một ngày dài.",
      purpose: "Miêu tả hoạt động giúp bạn thoải mái về tinh thần sau công việc.",
      structures: [
        "unwind after work — thư giãn sau giờ làm",
        "unwind by + V-ing — thư giãn bằng cách làm gì",
        "take time to unwind — dành thời gian để thư giãn"
      ],
      commonMistakes: "Trong nghĩa thư giãn, trọng âm rơi vào âm tiết thứ hai: un-WIND. Quá khứ của động từ này là unwound.",
      examples: [
        {
          en: "I like to unwind by listening to music after work.",
          vi: "Tôi thích thư giãn bằng cách nghe nhạc sau giờ làm."
        },
        {
          en: "She needs some time to unwind after a stressful day.",
          vi: "Cô ấy cần chút thời gian để thư giãn sau một ngày căng thẳng."
        },
        {
          en: "We spent the evening unwinding at home.",
          vi: "Chúng tôi dành buổi tối thư giãn ở nhà."
        }
      ]
    },
    {
      id: "v1",
      word: "procrastinate",
      phonetic: "/prəˈkræs.tɪ.neɪt/",
      partOfSpeech: "v",
      meaning: "hoãn lại, chần chừ, để chậm trễ",
      usage: "Dùng để nói về thói quen trì hoãn công việc dù biết sẽ đem lại hậu quả tiêu cực.",
      structures: [
        "procrastinate on sth — trì hoãn việc gì",
        "stop procrastinating — ngừng chần chừ"
      ],
      examples: [
        {
          en: "When faced with difficult problems, people often procrastinate rather than act.",
          vi: "Khi đối mặt với các vấn đề khó, mọi người thường trì hoãn thay vì hành động."
        }
      ]
    },
    {
      id: "v2",
      word: "resilient",
      phonetic: "/rɪˈzɪl.jənt/",
      partOfSpeech: "adj",
      meaning: "kiên cường, có khả năng phục hồi nhanh sau khó khăn",
      example: "A resilient mindset allows individuals to bounce back from failure."
    },
    {
      id: "v3",
      word: "cognitive",
      phonetic: "/ˈkɒɡ.nə.tɪv/",
      partOfSpeech: "adj",
      meaning: "liên quan đến nhận thức, tư duy",
      example: "Sleep deprivation impairs cognitive performance and critical decision-making."
    },
    {
      id: "v4",
      word: "meticulous",
      phonetic: "/məˈtɪk.jə.ləs/",
      partOfSpeech: "adj",
      meaning: "tỉ mỉ, cẩn thận từng chi tiết nhỏ",
      example: "She kept meticulous notes throughout the entire research project."
    },
    {
      id: "v5",
      word: "perseverance",
      phonetic: "/ˌpɜː.sɪˈvɪə.rəns/",
      partOfSpeech: "n",
      meaning: "sự kiên trì, bền bỉ theo đuổi mục tiêu",
      example: "Success is rarely instant; it is the culmination of perseverance and discipline."
    },
    {
      id: "v6",
      word: "unprecedented",
      phonetic: "/ʌnˈpres.ɪ.den.tɪd/",
      partOfSpeech: "adj",
      meaning: "chưa từng có tiền lệ, chưa từng thấy trước đây",
      example: "The tech industry is evolving at an unprecedented pace."
    },
    {
      id: "v7",
      word: "ambiguous",
      phonetic: "/æmˈbɪɡ.ju.əs/",
      partOfSpeech: "adj",
      meaning: "mơ hồ, nước đôi, khó hiểu rõ ràng",
      example: "The instructions were ambiguous, leaving team members confused."
    },
    {
      id: "v8",
      word: "prioritize",
      phonetic: "/praɪˈɒr.ɪ.taɪz/",
      partOfSpeech: "v",
      meaning: "ưu tiên, sắp xếp theo thứ tự quan trọng",
      example: "You must learn to prioritize high-impact tasks over urgent distractions."
    },
    {
      id: "v9",
      word: "detrimental",
      phonetic: "/ˌdet.rɪˈmen.təl/",
      partOfSpeech: "adj",
      meaning: "có hại, gây bất lợi",
      example: "Constant multitasking can be detrimental to your attention span."
    },
    {
      id: "v10",
      word: "comprehensive",
      phonetic: "/ˌkɒm.prɪˈhen.sɪv/",
      partOfSpeech: "adj",
      meaning: "toàn diện, bao quát mọi mặt",
      example: "The team conducted a comprehensive audit of all system logs."
    },
    {
      id: "v11",
      word: "alleviate",
      phonetic: "/əˈliː.vi.eɪt/",
      partOfSpeech: "v",
      meaning: "làm giảm bớt, xoa dịu (nỗi đau, áp lực, gánh nặng)",
      example: "Exercise and meditation can help alleviate chronic work stress."
    },
    {
      id: "v12",
      word: "monotonous",
      phonetic: "/məˈnɒt.ən.əs/",
      partOfSpeech: "adj",
      meaning: "đơn điệu, tẻ nhạt, lặp đi lặp lại",
      example: "Automation frees workers from monotonous and repetitive tasks."
    },
    {
      id: "v13",
      word: "lucid",
      phonetic: "/ˈluː.sɪd/",
      partOfSpeech: "adj",
      meaning: "rõ ràng, minh bạch, sáng suốt",
      example: "The professor gave a lucid explanation of complex quantum principles."
    },
    {
      id: "v14",
      word: "subtle",
      phonetic: "/ˈsʌt.əl/",
      partOfSpeech: "adj",
      meaning: "tinh tế, khó nhận ra, khéo léo",
      example: "There was a subtle shift in tone during the negotiations."
    },
    {
      id: "v15",
      word: "feasible",
      phonetic: "/ˈfiː.zə.bəl/",
      partOfSpeech: "adj",
      meaning: "khả thi, có thể thực hiện được",
      example: "With current budget constraints, launching next month is not feasible."
    },
    {
      id: "v16",
      word: "fluctuate",
      phonetic: "/ˈflʌk.tʃu.eɪt/",
      partOfSpeech: "v",
      meaning: "dao động, biến động lên xuống thất thường",
      example: "Prices tend to fluctuate according to seasonal market demand."
    },
    {
      id: "v17",
      word: "ephemeral",
      phonetic: "/ɪˈfem.ər.əl/",
      partOfSpeech: "adj",
      meaning: "phù du, sớm nở tối tàn, ngắn ngủi",
      example: "Viral fame on social media is often ephemeral."
    },
    {
      id: "v18",
      word: "synthesize",
      phonetic: "/ˈsɪn.θə.saɪz/",
      partOfSpeech: "v",
      meaning: "tổng hợp, kết hợp nhiều nguồn thông tin lại",
      example: "An analyst must synthesize vast amounts of raw data into actionable insights."
    },
    {
      id: "v19",
      word: "ubiquitous",
      phonetic: "/juːˈbɪk.wɪ.təs/",
      partOfSpeech: "adj",
      meaning: "ở khắp mọi nơi, phổ biến rộng rãi",
      example: "Smartphones have become ubiquitous across all modern societies."
    },
    {
      id: "v20",
      word: "discern",
      phonetic: "/dɪˈsɜːn/",
      partOfSpeech: "v",
      meaning: "nhận thức rõ, phân biệt, nhận ra điều gì đó tinh tế",
      example: "It was hard to discern whether the client was satisfied or simply polite."
    }
  ],
  exercises: [
    {
      id: 1,
      type: "multiple_choice",
      question: "Despite numerous setbacks during the initial launch, the team remained _______ and completed the project on time.",
      options: ["resilient", "ephemeral", "monotonous", "ambiguous"],
      answer: "resilient",
      explanation: "'Resilient' mang nghĩa kiên cường, vượt qua nghịch cảnh (setbacks)."
    },
    {
      id: 2,
      type: "fill_in_blank",
      question: "Constant phone notifications can be _______ (có hại) to deep concentration.",
      answer: "detrimental",
      explanation: "'Detrimental' đi với giới từ 'to', nghĩa là gây hại đến sự tập trung sâu."
    },
    {
      id: 3,
      type: "multiple_choice",
      question: "The engineer conducted a _______ review of the system code before pushing to production.",
      options: ["meticulous", "ubiquitous", "subtle", "monotonous"],
      answer: "meticulous",
      explanation: "'Meticulous' nghĩa là tỉ mỉ, kỹ lưỡng đến từng chi tiết nhỏ."
    },
    {
      id: 4,
      type: "fill_in_blank",
      question: "We need to _______ (ưu tiên) the critical security fixes before adding new features.",
      answer: "prioritize",
      explanation: "'Prioritize' là động từ có nghĩa là ưu tiên hóa."
    },
    {
      id: 5,
      type: "multiple_choice",
      question: "Because the instructions were intentionally _______, students had to seek further clarification.",
      options: ["ambiguous", "lucid", "feasible", "comprehensive"],
      answer: "ambiguous",
      explanation: "'Ambiguous' nghĩa là mơ hồ, không rõ ràng nên cần hỏi lại (seek clarification)."
    },
    {
      id: 6,
      type: "fill_in_blank",
      question: "A short walk in the park can help _______ (làm giảm bớt) mental fatigue.",
      answer: "alleviate",
      explanation: "'Alleviate' có nghĩa là làm dịu hoặc giảm bớt căng thẳng, mệt mỏi."
    },
    {
      id: 7,
      type: "multiple_choice",
      question: "With modern cloud computing, digital collaboration tools have become _______ in remote work environments.",
      options: ["ubiquitous", "ephemeral", "ambiguous", "detrimental"],
      answer: "ubiquitous",
      explanation: "'Ubiquitous' chỉ những thứ phổ biến ở khắp mọi nơi."
    },
    {
      id: 8,
      type: "fill_in_blank",
      question: "He had a tendency to _______ (trì hoãn) whenever he was assigned a complex assignment.",
      answer: "procrastinate",
      explanation: "'Procrastinate' là động từ chỉ hành động trì hoãn công việc."
    },
    {
      id: 9,
      type: "multiple_choice",
      question: "The author managed to present a _______ and compelling summary of twentieth-century economics.",
      options: ["lucid", "monotonous", "fluctuating", "detrimental"],
      answer: "lucid",
      explanation: "'Lucid' nghĩa là sáng sủa, rõ ràng, dễ hiểu."
    },
    {
      id: 10,
      type: "fill_in_blank",
      question: "Is it technically _______ (khả thi) to build this entire module within two weeks?",
      answer: "feasible",
      explanation: "'Feasible' là tính từ nghĩa là có khả thi, thực hiện được."
    },
    {
      id: 11,
      type: "multiple_choice",
      question: "Data scientists must _______ disparate streams of user behavior into coherent patterns.",
      options: ["synthesize", "fluctuate", "alleviate", "procrastinate"],
      answer: "synthesize",
      explanation: "'Synthesize' có nghĩa là tổng hợp các luồng thông tin khác nhau lại."
    },
    {
      id: 12,
      type: "fill_in_blank",
      question: "Online trends are notoriously _______ (ngắn ngủi), fading away within days.",
      answer: "ephemeral",
      explanation: "'Ephemeral' nghĩa là sớm nở tối tàn, chỉ tồn tại trong thời gian ngắn."
    },
    {
      id: 13,
      type: "multiple_choice",
      question: "Doing data entry without any creative challenge quickly became _______ and exhausting.",
      options: ["monotonous", "resilient", "unprecedented", "feasible"],
      answer: "monotonous",
      explanation: "'Monotonous' nghĩa là đơn điệu, lặp đi lặp lại tẻ nhạt."
    },
    {
      id: 14,
      type: "fill_in_blank",
      question: "Exchange rates will continue to _______ (dao động) due to geopolitical uncertainty.",
      answer: "fluctuate",
      explanation: "'Fluctuate' có nghĩa là biến động, dao động lên xuống."
    },
    {
      id: 15,
      type: "multiple_choice",
      question: "The growth rate of the generative AI sector over the last year is virtually _______.",
      options: ["unprecedented", "monotonous", "ambiguous", "detrimental"],
      answer: "unprecedented",
      explanation: "'Unprecedented' nghĩa là chưa từng thấy trước đây (chưa có tiền lệ)."
    },
    {
      id: 16,
      type: "fill_in_blank",
      question: "It requires genuine skill to _______ (nhận ra, phân biệt) authentic news from AI-generated deepfakes.",
      answer: "discern",
      explanation: "'Discern' nghĩa là nhận thức rõ, phân biệt sự thật."
    },
    {
      id: 17,
      type: "multiple_choice",
      question: "Achieving mastery in any foreign language demands years of steady _______.",
      options: ["perseverance", "fluctuation", "ambiguity", "ephemeralness"],
      answer: "perseverance",
      explanation: "'Perseverance' là tính kiên trì, bền bỉ theo đuổi."
    },
    {
      id: 18,
      type: "fill_in_blank",
      question: "There was a _______ (tinh tế, khó nhận ra) difference between the original and the replica.",
      answer: "subtle",
      explanation: "'Subtle' nghĩa là tinh tế, khó phát hiện bằng mắt thường."
    },
    {
      id: 19,
      type: "multiple_choice",
      question: "Intense physical training has well-documented benefits for _______ health and memory.",
      options: ["cognitive", "monotonous", "ambiguous", "ephemeral"],
      answer: "cognitive",
      explanation: "'Cognitive' liên quan tới nhận thức, trí nhớ và não bộ."
    },
    {
      id: 20,
      type: "fill_in_blank",
      question: "The company provides a _______ (toàn diện) training program for all incoming interns.",
      answer: "comprehensive",
      explanation: "'Comprehensive' nghĩa là toàn diện, bao quát mọi mặt."
    }
  ]
};

