/**
 * Focal Point Picker module
 */
const FocalPicker = {
	init: view => {
		// Set properties
		FocalPicker.view     = view;
		FocalPicker.position = view.model.get('focalPoint');
		FocalPicker.wrapper  = view.$el.find('.image-focal__wrapper');
		FocalPicker.point    = view.$el.find('.image-focal__point');
		FocalPicker.picker   = view.$el.find('.image-focal__clickarea');
		FocalPicker.image    = FocalPicker.wrapper.find('img');
		// Add event listners
		FocalPicker.setEventListeners();
		FocalPicker.positionFocalPoint(FocalPicker.position);
	},
	setEventListeners: () => {
		// On layout change
		jQuery(window).on('resize', FocalPicker.updateInterface);
		FocalPicker.image.on('load', e => {
			FocalPicker.updateInterface();
		});

		// On click
		FocalPicker.picker.on('click', FocalPicker.setFocalPoint);

		// On drag
		if (typeof(jQuery.ui.draggable) === 'function') {
			FocalPicker.point.draggable({
				cursor: 'move',
				start: FocalPicker.startDrag,
				drag: FocalPicker.dragging,
				stop: FocalPicker.stopDrag,
				containment: FocalPicker.wrapper
			});
		}
	},
	updateInterface: () => {
		FocalPicker.wrapper.css({
			width: `${FocalPicker.image.width()}px`
		});
	},
	positionFocalPoint: position => {
		FocalPicker.position = position;
		FocalPicker.view.model.set('focalPoint', position);
		FocalPicker.point.css({
			left: `${position?.x}%`,
			top: `${position?.y}%`,
			position: 'absolute'
		});
		FocalPicker.syncInputFields(position);
	},
	syncInputFields: position => {
		// The compat fields view doesn't re-render on model changes,
		// so update the sidebar inputs directly
		const id = FocalPicker.view.model.get('id');
		jQuery(`input[name="attachments[${id}][responsive_pics_focal_point_x]"]`).val(position?.x);
		jQuery(`input[name="attachments[${id}][responsive_pics_focal_point_y]"]`).val(position?.y);
	},
	setFocalPoint: e => {
		const pointYOffset = e.offsetY - FocalPicker.point.height() / 2;
		const pointXOffset = e.offsetX - FocalPicker.point.width() / 2;

		// Convert absolute coordinates to percentages
		FocalPicker.position.x = Math.round(pointXOffset / FocalPicker.picker.width() * 100);
		FocalPicker.position.y = Math.round(pointYOffset / FocalPicker.picker.height() * 100);

		FocalPicker.positionFocalPoint(FocalPicker.position);
		FocalPicker.saveFocalPoint(FocalPicker.view.model);
	},
	saveFocalPoint: attachment => {
		let request;
		if (request) {
			request.abort();
		}

		request = jQuery.ajax({
			url: wp?.ajax?.settings?.url,
			method: 'POST',
			data: {
				action: 'save_focal_point',
				attachment: attachment?.attributes
			},
			beforeSend: () => {
				FocalPicker.view.updateSave('waiting');
			}
		})
		.done(data => {
			FocalPicker.view.update();
		})
		.fail((jqXHR, textStatus) => {
			console.error('ResponsivePics error while saving focal point', jqXHR.statusText);
		})
		.always(() => {
			FocalPicker.view.updateSave('ready');
			request = null;
		});
	},
	startDrag: e => {
		jQuery('body').addClass('focal-point-dragging');
	},
	dragging: e => {
		FocalPicker.position.x = Math.round(e.target.offsetLeft / FocalPicker.picker.width() * 100);
		FocalPicker.position.y = Math.round(e.target.offsetTop / FocalPicker.picker.height() * 100);
	},
	stopDrag: e => {
		jQuery('body').removeClass('focal-point-dragging');
		FocalPicker.positionFocalPoint(FocalPicker.position);
		FocalPicker.saveFocalPoint(FocalPicker.view.model);
	}
};

export default FocalPicker;