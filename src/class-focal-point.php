<?php

class RP_Focal_Point extends ResponsivePics
{
	/**
	 * Construct Focal Point
	 */
	public function __construct() {
		add_action('admin_enqueue_scripts',        ['RP_Focal_Point', 'load_scripts']);
		add_action('print_media_templates',        ['RP_Focal_Point', 'print_media_templates'], 10, 1);
		add_filter('attachment_fields_to_edit',    ['RP_Focal_Point', 'attachment_fields_to_edit'], 10, 2);
		add_filter('attachment_fields_to_save',    ['RP_Focal_Point', 'attachment_fields_to_save'], 10, 2);
		add_filter('wp_prepare_attachment_for_js', ['RP_Focal_Point', 'wp_prepare_attachment_for_js'], 10, 3);
		add_action('rest_api_init',                ['RP_Focal_Point', 'register_rest_field']);
		add_action('wp_ajax_save_focal_point',     ['RP_Focal_Point', 'save_focal_point']);
	}

	/**
	 * Enqueues all necessary CSS and Scripts
	 */
	public static function load_scripts() {
		// Scripts
		$assets = ResponsivePicsWP::$enqueue->enqueue('focalpoint', 'admin', [
			'js'        => true,
			'css'       => true,
			'js_dep'    => ['jquery'],
			'css_dep'   => [],
			'in_footer' => false
		]);
		$entry_point = array_pop($assets['js']);
		wp_localize_script($entry_point['handle'], 'responsivePicsL10n', self::focal_point_l10n());

		// Styles
		$assets = ResponsivePicsWP::$enqueue->enqueue('focalpoint', 'admin', [
			'js'  => false,
			'css' => true
		]);
	}

	/**
	 * Print custom media templates
	 */
	public static function print_media_templates() {
		include('views/tmpl-attachment-details-focal-point.php');
	}

	/**
	 * Add custom focal point attachment field
	 */
	public static function attachment_fields_to_edit($form_fields, $post) {
		// Exclude applications
		if (preg_match('/application/', $post->post_mime_type)) {
			return $form_fields;
		}

		$focal_point = get_post_meta($post->ID, 'responsive_pics_focal_point', true);
		$focal_x     = isset($focal_point['x']) ? (float) $focal_point['x'] : 50;
		$focal_y     = isset($focal_point['y']) ? (float) $focal_point['y'] : 50;

		$form_fields['responsive_pics_focal_point_x'] = array(
			'label'      => 'Focal Point X-axis (%)',
			'input'      => 'html',
			'html'       => self::focal_point_number_input($post->ID, 'responsive_pics_focal_point_x', $focal_x),
			'exclusions' => array('audio', 'video')
		);
		$form_fields['responsive_pics_focal_point_y'] = array(
			'label'      => 'Focal Point Y-axis (%)',
			'input'      => 'html',
			'html'       => self::focal_point_number_input($post->ID, 'responsive_pics_focal_point_y', $focal_y),
			'exclusions' => array('audio', 'video')
		);

		return $form_fields;
	}

	/**
	 * Render a number input for a focal point axis,
	 * following the name/id conventions of get_compat_media_markup()
	 */
	private static function focal_point_number_input($attachment_id, $key, $value) {
		return sprintf(
			"<input type='number' class='text' id='%s' name='%s' value='%s' step='0.1' min='0' max='100' />",
			esc_attr("attachments-{$attachment_id}-{$key}"),
			esc_attr("attachments[{$attachment_id}][{$key}]"),
			esc_attr($value)
		);
	}

	/**
	 * Save custom focal point attachment field
	 */
	public static function attachment_fields_to_save($post, $attachment) {
		if (isset($attachment['responsive_pics_focal_point_x']) &&
			isset($attachment['responsive_pics_focal_point_y'])) {
			$focal_point_x = $attachment['responsive_pics_focal_point_x'];
			$focal_point_y = $attachment['responsive_pics_focal_point_y'];
			$focal_point   = [
				'x' => round((float) $focal_point_x, 1),
				'y' => round((float) $focal_point_y, 1)
			];
			update_post_meta($post['ID'], 'responsive_pics_focal_point', $focal_point);
		} else {
			delete_post_meta($post['ID'], 'responsive_pics_focal_point' );
		}

		return $post;
	}

	/**
	 * Adding custom attachment fields to REST api response
	 */
	public static function register_rest_field() {
		register_rest_field(
			'attachment',
			'focal_point', [
				'get_callback' => function($attachment) {
					$focal_point = get_post_meta($attachment['id'], 'responsive_pics_focal_point', true);
					$default = [
						'x' => 50,
						'y' => 50
					];

					return $focal_point ?: $default;
				}
			]
		);
	}

	/**
	 * Add focal point to attachment data for JavaScript
	 */
	public static function wp_prepare_attachment_for_js($response, $attachment, $meta) {
		$focal_point = get_post_meta($attachment->ID, 'responsive_pics_focal_point', true);
		$default = [
			'x' => 50,
			'y' => 50
		];

		$response['focalPoint'] = $focal_point ?: $default;

		return $response;
	}

	/**
	 * Return all the translation strings necessary for the javascript
	 *
	 * @return array
	 */
	private static function focal_point_l10n() {
		return [
			'saveButton' => __('Save Focal Point', RESPONSIVE_PICS_TEXTDOMAIN),
			'saving'     => __('Saving…', RESPONSIVE_PICS_TEXTDOMAIN),
			'saved'      => __('Saved', RESPONSIVE_PICS_TEXTDOMAIN),
			'tryAgain'   => __('Please Try Again', RESPONSIVE_PICS_TEXTDOMAIN)
		];
	}

	/**
	 * Set the focalpoint of the attachment as post meta
	 */
	public static function save_focal_point() {
		$attachment  = isset($_POST['attachment']) ? $_POST['attachment'] : [];
		$focal_point = isset($attachment['focalPoint']) ? $attachment['focalPoint'] : null;
		$post_id     = isset($attachment['id']) ? $attachment['id'] : null;

		// Save the focal point if there is one
		if ($post_id && is_array($focal_point) && isset($focal_point['x'], $focal_point['y'])) {
			update_post_meta($post_id, 'responsive_pics_focal_point', [
				'x' => round((float) $focal_point['x'], 1),
				'y' => round((float) $focal_point['y'], 1)
			]);
			wp_send_json_success();
		}

		// Return the ajax call
		wp_send_json_error();
	}
}