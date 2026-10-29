import confetti from 'canvas-confetti';

/**
 * Hiệu ứng bắn pháo hoa rực rỡ khi hoàn thành bài tập / quiz
 */
export function triggerFireworks() {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  // Đợt 1: Bắn pháo hoa trung tâm và 2 bên góc dưới màn hình
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { x: 0.5, y: 0.6 },
    zIndex: 9999,
  });

  confetti({
    particleCount: 60,
    angle: 60,
    spread: 70,
    origin: { x: 0.05, y: 0.8 },
    zIndex: 9999,
  });

  confetti({
    particleCount: 60,
    angle: 120,
    spread: 70,
    origin: { x: 0.95, y: 0.8 },
    zIndex: 9999,
  });

  // Đợt 2: Các chùm pháo hoa liên tiếp nổ bung trên bầu trời trong 2.5 giây
  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = Math.floor(40 * (timeLeft / duration)) + 15;

    // Tọa độ ngẫu nhiên ở phần trên màn hình
    const randomX = Math.random() * 0.7 + 0.15;
    const randomY = Math.random() * 0.35 + 0.15;

    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      ticks: 75,
      origin: { x: randomX, y: randomY },
      zIndex: 9999,
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'],
    });
  }, 350);
}

