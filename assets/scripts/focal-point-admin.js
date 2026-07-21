import FocalPicker from './modules/focal-picker';

(function($) {

	$(document).ready(() => {
		/**
		 * Update the focal point live while editing the sidebar inputs,
		 * instead of waiting for the change event on blur.
		 * Debounced so the point doesn't jump to intermediate
		 * values (e.g. 3%) while typing a value like 36.7
		 */
		const debounce = (fn, wait) => {
			let timer;
			return (...args) => {
				clearTimeout(timer);
				timer = setTimeout(() => fn(...args), wait);
			};
		};

		$(document).on(
			'input',
			'input[name$="[responsive_pics_focal_point_x]"], input[name$="[responsive_pics_focal_point_y]"]',
			debounce(FocalPicker.updateFromInputFields, 300)
		);

		/**
		 * Attachment Details
		 */
		const initAttachmentDetails = element => {
			// Append focal point selector
			const mediaView   = wp?.media?.template('attachment-details-focal-point');
			const mediaParent = element.find('.thumbnail');
			const mediaImage  = mediaParent.find('img');

			// Set image focal elements
			if (mediaView && mediaParent.length && mediaImage.length) {
				mediaParent.prepend(mediaView);
				const mediaWrapper = mediaParent.find('.image-focal__wrapper');
				mediaImage.prependTo(mediaWrapper);
			}
		};

		/**
		 * Extend WP Media views
		 */
		const Attachment = wp?.media?.view?.Attachment;
		const AttachmentDetails = wp?.media?.view?.Attachment?.Details;
		const TwoColumnView = wp?.media?.view?.Attachment?.Details?.TwoColumn;

		/**
		 * Extend Attachment Details TwoColumn view (Media Library Modal)
		 */
		if (TwoColumnView) {
			wp.media.view.Attachment.Details.TwoColumn = TwoColumnView.extend({
				// Add focalPoint change listener
				initialize: function() {
					TwoColumnView.prototype.initialize.apply(this, arguments);
					this.model.on('change:focalPoint', this.change, this);
				},
				// Init extended template
				render: function() {
					Attachment.prototype.render.apply(this, arguments);
					const type = this.model.get('type');

					if (type === 'image') {
						initAttachmentDetails(this.$el);
						FocalPicker.init(this);
					}
				},
				// Re-init focal point on input change
				change: function() {
					const type = this.model.get('type');
					const focalPoint = this.model.get('focalPoint');

					if (type === 'image') {
						FocalPicker.positionFocalPoint(focalPoint);
					}
				},
				// Refresh the model (incl. compat field markup) after a focal point save.
				// Don't detach/re-render the subviews: that rebuilds the sidebar DOM,
				// losing focus and scroll position. The input values are already
				// synced directly by FocalPicker.
				update: function() {
					this.model.fetch();
				}
			});
		}

		/**
		 * Extend Attachment Details view (Post Edit Modal)
		 */
		if (AttachmentDetails) {
			wp.media.view.Attachment.Details = AttachmentDetails.extend({
				// Add focalPoint change listener.
				// Call the Details initialize (not Attachment's) so
				// rerenderOnModelChange stays false: a full re-render on every
				// model change rebuilds the sidebar DOM, losing focus and
				// scroll position while editing the focal point inputs
				initialize: function() {
					AttachmentDetails.prototype.initialize.apply(this, arguments);
					this.model.on('change:focalPoint', this.change, this);
				},
				// Init extended template
				render: function() {
					Attachment.prototype.render.apply(this, arguments);
					const id   = this.model.get('id');
					const type = this.model.get('type');

					if (type === 'image') {
						initAttachmentDetails(this.$el);
						FocalPicker.init(this);
					}
				},
				// Re-init focal point on input change
				change: function() {
					const type = this.model.get('type');
					const focalPoint = this.model.get('focalPoint');

					if (type === 'image') {
						FocalPicker.positionFocalPoint(focalPoint);
					}
				},
				// Refresh the model (incl. compat field markup) after a focal point save.
				// Don't detach/re-render the subviews: that rebuilds the sidebar DOM,
				// losing focus and scroll position. The input values are already
				// synced directly by FocalPicker.
				update: function() {
					this.model.fetch();
				}
			});
		}
	});
})(jQuery);
