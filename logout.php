<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost/spendly');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    session_destroy();
    error_log("User logged out");
    echo json_encode(['status' => 'success', 'message' => 'Logged out successfully']);
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>