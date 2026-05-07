<?php
/**
 * Plugin Name: Arcigy Chatbot
 * Description: React chatbot widget for WordPress frontends.
 * Version: 0.1.0
 * Author: Arcigy
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ARCIGY_CHATBOT_VERSION', '0.1.0');
define('ARCIGY_CHATBOT_FILE', __FILE__);
define('ARCIGY_CHATBOT_DIR', plugin_dir_path(__FILE__));
define('ARCIGY_CHATBOT_URL', plugin_dir_url(__FILE__));
define('ARCIGY_CHATBOT_OPTION', 'arcigy_chatbot_options');

require_once ARCIGY_CHATBOT_DIR . 'includes/class-rest.php';
require_once ARCIGY_CHATBOT_DIR . 'includes/class-admin.php';

function arcigy_chatbot_default_options() {
    return array(
        'enabled' => '1',
        'mode' => 'fake',
        'external_backend_url' => '',
        'api_key' => '',
        'show_on_all_pages' => '1',
    );
}

function arcigy_chatbot_options() {
    $options = get_option(ARCIGY_CHATBOT_OPTION, array());
    return wp_parse_args(is_array($options) ? $options : array(), arcigy_chatbot_default_options());
}

function arcigy_chatbot_should_render() {
    $options = arcigy_chatbot_options();

    if ($options['enabled'] !== '1') {
        return false;
    }

    return $options['show_on_all_pages'] === '1' || is_front_page();
}

function arcigy_chatbot_enqueue_assets() {
    if (!arcigy_chatbot_should_render()) {
        return;
    }

    $script_path = ARCIGY_CHATBOT_DIR . 'assets/chatbot.js';
    $style_path = ARCIGY_CHATBOT_DIR . 'assets/chatbot.css';

    wp_enqueue_style(
        'arcigy-chatbot',
        ARCIGY_CHATBOT_URL . 'assets/chatbot.css',
        array(),
        file_exists($style_path) ? (string) filemtime($style_path) : ARCIGY_CHATBOT_VERSION
    );

    wp_enqueue_script(
        'arcigy-chatbot',
        ARCIGY_CHATBOT_URL . 'assets/chatbot.js',
        array(),
        file_exists($script_path) ? (string) filemtime($script_path) : ARCIGY_CHATBOT_VERSION,
        true
    );

    wp_localize_script(
        'arcigy-chatbot',
        'ArcigyChatbotConfig',
        array(
            'restUrl' => esc_url_raw(rest_url('arcigy-chatbot/v1/message')),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUrl' => esc_url_raw(home_url(add_query_arg(array(), $GLOBALS['wp']->request ?? ''))),
            'siteUrl' => esc_url_raw(home_url('/')),
            'pluginVersion' => ARCIGY_CHATBOT_VERSION,
        )
    );
}
add_action('wp_enqueue_scripts', 'arcigy_chatbot_enqueue_assets');

function arcigy_chatbot_render_root() {
    if (!arcigy_chatbot_should_render()) {
        return;
    }

    echo '<div id="arcigy-chatbot-root"></div>';
}
add_action('wp_footer', 'arcigy_chatbot_render_root', 5);

add_action('plugins_loaded', function () {
    new Arcigy_Chatbot_REST();
    new Arcigy_Chatbot_Admin();
});
