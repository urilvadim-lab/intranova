<?php
// Обработчик формы записи: отправляет заявку на почту организатора.
header('Content-Type: application/json; charset=utf-8');

$TO = 'karachinsev@yandex.ru';
$FROM = 'noreply@intranova.ru';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

// Боты заполняют скрытое поле — делаем вид, что всё хорошо.
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

function clean($key, $max) {
    $v = isset($_POST[$key]) ? trim((string)$_POST[$key]) : '';
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max, 'UTF-8');
}

$name = clean('name', 80);
$contact = clean('contact', 80);
$tariff = clean('tariff', 80);
$message = clean('message', 1500);
$consent = !empty($_POST['consent']);

if ($name === '' || $contact === '' || !$consent) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation']);
    exit;
}

$subject = '=?UTF-8?B?' . base64_encode('Заявка на интенсив по психосоматике: ' . $name) . '?=';
$body = "Новая заявка с сайта intranova.ru\n\n"
    . "Имя: {$name}\n"
    . "Контакт: {$contact}\n"
    . "Формат: " . ($tariff !== '' ? $tariff : '—') . "\n"
    . "Запрос: " . ($message !== '' ? $message : '—') . "\n\n"
    . "Время: " . date('d.m.Y H:i') . "\n"
    . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\n";

$headers = "From: INTRANOVA <{$FROM}>\r\n"
    . "MIME-Version: 1.0\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n";

$ok = mail($TO, $subject, $body, $headers, "-f{$FROM}");
if (!$ok) http_response_code(500);
echo json_encode(['ok' => $ok]);
