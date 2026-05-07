<?php

if (!defined('ABSPATH')) {
    exit;
}

class Arcigy_Chatbot_Admin {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function add_menu() {
        add_options_page(
            'Arcigy Chatbot',
            'Arcigy Chatbot',
            'manage_options',
            'arcigy-chatbot',
            array($this, 'render_page')
        );
    }

    public function register_settings() {
        register_setting(
            'arcigy_chatbot_settings',
            ARCIGY_CHATBOT_OPTION,
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_options'),
                'default' => arcigy_chatbot_default_options(),
            )
        );
    }

    public function sanitize_options($input) {
        $input = is_array($input) ? $input : array();

        return array(
            'enabled' => !empty($input['enabled']) ? '1' : '0',
            'mode' => in_array($input['mode'] ?? 'fake', array('fake', 'local', 'external'), true) ? $input['mode'] : 'fake',
            'external_backend_url' => esc_url_raw($input['external_backend_url'] ?? ''),
            'api_key' => sanitize_text_field($input['api_key'] ?? ''),
            'show_on_all_pages' => !empty($input['show_on_all_pages']) ? '1' : '0',
        );
    }

    public function render_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $options = arcigy_chatbot_options();
        ?>
        <div class="wrap">
            <h1>Arcigy Chatbot</h1>
            <form method="post" action="options.php">
                <?php settings_fields('arcigy_chatbot_settings'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">Enabled</th>
                        <td>
                            <label>
                                <input type="checkbox" name="<?php echo esc_attr(ARCIGY_CHATBOT_OPTION); ?>[enabled]" value="1" <?php checked($options['enabled'], '1'); ?>>
                                Show chatbot widget
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Mode</th>
                        <td>
                            <select name="<?php echo esc_attr(ARCIGY_CHATBOT_OPTION); ?>[mode]">
                                <option value="fake" <?php selected($options['mode'], 'fake'); ?>>fake</option>
                                <option value="local" <?php selected($options['mode'], 'local'); ?>>local</option>
                                <option value="external" <?php selected($options['mode'], 'external'); ?>>external</option>
                            </select>
                            <p class="description">Fake/local uses the built-in deterministic test responder. External forwards server-side.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">External backend URL</th>
                        <td>
                            <input class="regular-text" type="url" name="<?php echo esc_attr(ARCIGY_CHATBOT_OPTION); ?>[external_backend_url]" value="<?php echo esc_attr($options['external_backend_url']); ?>">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">API key</th>
                        <td>
                            <input class="regular-text" type="password" name="<?php echo esc_attr(ARCIGY_CHATBOT_OPTION); ?>[api_key]" value="<?php echo esc_attr($options['api_key']); ?>" autocomplete="off">
                            <p class="description">Stored only in WordPress options. It is not sent to frontend JavaScript.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Show on all pages</th>
                        <td>
                            <label>
                                <input type="checkbox" name="<?php echo esc_attr(ARCIGY_CHATBOT_OPTION); ?>[show_on_all_pages]" value="1" <?php checked($options['show_on_all_pages'], '1'); ?>>
                                Render widget on every frontend page
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <h2>Diagnostics</h2>
            <table class="widefat striped" style="max-width: 760px;">
                <tbody>
                    <tr>
                        <th>chatbot.js</th>
                        <td><?php echo file_exists(ARCIGY_CHATBOT_DIR . 'assets/chatbot.js') ? 'OK' : 'Missing'; ?></td>
                    </tr>
                    <tr>
                        <th>chatbot.css</th>
                        <td><?php echo file_exists(ARCIGY_CHATBOT_DIR . 'assets/chatbot.css') ? 'OK' : 'Missing'; ?></td>
                    </tr>
                    <tr>
                        <th>REST endpoint</th>
                        <td><code><?php echo esc_html(rest_url('arcigy-chatbot/v1/message')); ?></code></td>
                    </tr>
                    <tr>
                        <th>Selectors to verify in pages</th>
                        <td><code>#nibe-s2125</code>, <code>#dotacie</code>, <code>#kontakt-formular</code>, <code>#faq-cena</code></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <?php
    }
}
