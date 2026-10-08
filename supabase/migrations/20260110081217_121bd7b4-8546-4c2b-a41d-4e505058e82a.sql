-- Insert sample weekly challenges
INSERT INTO weekly_challenges (title, description, challenge_type, target_metric, target_value, reward_xp, reward_badge, starts_at, ends_at, is_active)
VALUES 
  (
    'Registrador Iniciante',
    'Registre 10 transações esta semana para ganhar XP extra',
    'individual',
    'transactions_registered',
    10,
    50,
    '📝',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ),
  (
    'Corrida dos Guardiões',
    'Quem registra mais transações esta semana? Compita com outros guardiões!',
    'competitive',
    'transactions_registered',
    50,
    150,
    '🏁',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ),
  (
    'Meta Coletiva',
    'Juntos, vamos registrar 500 transações como comunidade!',
    'collaborative',
    'transactions_registered',
    500,
    100,
    '🤝',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ),
  (
    'Pontualidade em Dia',
    'Pague 5 títulos antes do vencimento esta semana',
    'individual',
    'early_payments',
    5,
    75,
    '⏰',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  );