<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost/spendly');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT id, description, target_amount AS target, reward_points AS rewardPoints, achieved FROM goals WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $goals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($goals as &$goal) {
        $stmt = $pdo->prepare('SELECT date, amount FROM savings WHERE goal_id = ?');
        $stmt->execute([$goal['id']]);
        $goal['savings'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    echo json_encode(['status' => 'success', 'goals' => $goals]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $description = trim($data['description'] ?? '');
    $target = floatval($data['target'] ?? 0);
    $reward = intval($data['reward_points'] ?? 0);

    if (empty($description) || $target <= 0 || $reward <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid goal details']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO goals (user_id, description, target_amount, reward_points, achieved) VALUES (?, ?, ?, ?, 0)');
        $stmt->execute([$user_id, $description, $target, $reward]);
        echo json_encode(['status' => 'success', 'message' => 'Goal added']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Insert failed: ' . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $goal_id = intval($data['goal_id'] ?? 0);
    $achieved = intval($data['achieved'] ?? 0);

    if ($goal_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid goal ID']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('UPDATE goals SET achieved = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$achieved, $goal_id, $user_id]);

        if ($achieved) {
            $stmt = $pdo->prepare('SELECT reward_points FROM goals WHERE id = ?');
            $stmt->execute([$goal_id]);
            $reward_points = $stmt->fetchColumn();
            $stmt = $pdo->prepare('UPDATE users SET points = points + ? WHERE id = ?');
            $stmt->execute([$reward_points, $user_id]);
        }

        $stmt = $pdo->prepare('SELECT points FROM users WHERE id = ?');
        $stmt->execute([$user_id]);
        $points = $stmt->fetchColumn();

        echo json_encode(['status' => 'success', 'points' => $points]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Update failed: ' . $e->getMessage()]);
    }
}
?>