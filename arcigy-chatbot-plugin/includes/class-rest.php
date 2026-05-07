<?php

if (!defined('ABSPATH')) {
    exit;
}

class Arcigy_Chatbot_REST {
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    public function register_routes() {
        register_rest_route(
            'arcigy-chatbot/v1',
            '/message',
            array(
                'methods' => 'POST',
                'callback' => array($this, 'message'),
                'permission_callback' => array($this, 'verify_nonce'),
            )
        );

        register_rest_route(
            'arcigy-chatbot/v1',
            '/diagnostics',
            array(
                'methods' => 'GET',
                'callback' => array($this, 'diagnostics'),
                'permission_callback' => '__return_true',
            )
        );
    }

    public function verify_nonce($request) {
        $nonce = $request->get_header('X-WP-Nonce');

        if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('arcigy_chatbot_bad_nonce', 'Invalid chatbot nonce.', array('status' => 403));
        }

        return true;
    }

    public function message($request) {
        $payload = $request->get_json_params();
        $message = isset($payload['message']) ? sanitize_textarea_field((string) $payload['message']) : '';
        $current_url = isset($payload['currentUrl']) ? esc_url_raw((string) $payload['currentUrl']) : '';

        if ($message === '') {
            return new WP_Error('arcigy_chatbot_empty_message', 'Message is required.', array('status' => 400));
        }

        $options = arcigy_chatbot_options();

        if ($options['mode'] === 'external' && !empty($options['external_backend_url'])) {
            return $this->forward_to_external_backend($options, $message, $current_url);
        }

        return rest_ensure_response($this->fake_response($message));
    }

    private function forward_to_external_backend($options, $message, $current_url) {
        $headers = array('Content-Type' => 'application/json');

        if (!empty($options['api_key'])) {
            $headers['X-Arcigy-Api-Key'] = $options['api_key'];
        }

        $response = wp_remote_post(
            esc_url_raw($options['external_backend_url']),
            array(
                'timeout' => 20,
                'headers' => $headers,
                'body' => wp_json_encode(
                    array(
                        'message' => $message,
                        'currentUrl' => $current_url,
                    )
                ),
            )
        );

        if (is_wp_error($response)) {
            return new WP_Error('arcigy_chatbot_external_failed', 'External chatbot backend failed.', array('status' => 502));
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (!is_array($body)) {
            return new WP_Error('arcigy_chatbot_external_invalid', 'External chatbot backend returned invalid JSON.', array('status' => 502));
        }

        return rest_ensure_response($body);
    }

    private function fake_response($message) {
        $normalized = remove_accents(mb_strtolower($message));

        if (str_contains($normalized, 'nibe')) {
            return $this->response_for(
                'NIBE S2125 je ukážkový produktový intent vo fake režime. Kliknutím vás viem posunúť na sekciu produktu.',
                'Produkty',
                '/produkty/',
                'nibe-s2125',
                'NIBE S2125'
            );
        }

        if (str_contains($normalized, 'dotac')) {
            return $this->response_for(
                'Dotácie sú ukážkový intent pre navigáciu na dotačnú sekciu. Presné podmienky treba overiť podľa aktuálneho programu.',
                'Produkty',
                '/produkty/',
                'dotacie',
                'Dotácie'
            );
        }

        if (str_contains($normalized, 'kontakt') || str_contains($normalized, 'zavol')) {
            return $this->response_for(
                'Kontakt je pripravený ako akcia na kontaktný formulár.',
                'Kontakt',
                '/kontakt/',
                'kontakt-formular',
                'Kontaktný formulár'
            );
        }

        if (str_contains($normalized, 'cena') || str_contains($normalized, 'stoji') || str_contains($normalized, 'kolko')) {
            return $this->response_for(
                'Cena závisí od rozsahu riešenia, domu a montáže. Vo fake režime vás presuniem na FAQ sekciu o cene.',
                'FAQ',
                '/faq/',
                'faq-cena',
                'Cena'
            );
        }

        return $this->response_for(
            'Toto je lokálna fake odpoveď WordPress pluginu. Skúste otázku s výrazom NIBE, dotácie, kontakt alebo cena.',
            'Produkty',
            '/produkty/',
            'nibe-s2125',
            'NIBE S2125'
        );
    }

    private function response_for($answer, $page_title, $url, $section_id, $heading) {
        $selector = '#' . $section_id;

        return array(
            'answer' => $answer,
            'sources' => array(
                array(
                    'pageTitle' => $page_title,
                    'url' => $url,
                    'sectionId' => $section_id,
                    'selector' => $selector,
                    'heading' => $heading,
                ),
            ),
            'action' => array(
                'type' => 'navigate_and_highlight',
                'url' => $url,
                'selector' => $selector,
                'highlightText' => $heading,
            ),
        );
    }

    public function diagnostics() {
        return rest_ensure_response(
            array(
                'pluginLoaded' => true,
                'assets' => array(
                    'script' => file_exists(ARCIGY_CHATBOT_DIR . 'assets/chatbot.js'),
                    'style' => file_exists(ARCIGY_CHATBOT_DIR . 'assets/chatbot.css'),
                ),
                'restEndpoint' => rest_url('arcigy-chatbot/v1/message'),
                'sampleIntents' => array('nibe', 'dotácie', 'kontakt', 'cena'),
                'selectorsToVerify' => array('#nibe-s2125', '#dotacie', '#kontakt-formular', '#faq-cena'),
            )
        );
    }
}
