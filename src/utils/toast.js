/**
 * Fancy Toast & Dialog Utility
 * A modern, beautiful notification system using react-native-alert-notification
 * Supports both simple toasts and confirmation dialogs with action buttons
 */

import { ALERT_TYPE, Toast, Dialog } from 'react-native-alert-notification';
import { colors } from '../themes';

/**
 * Show a success toast notification
 * @param {string} title - The toast title
 * @param {string} message - The toast message (optional)
 */
export const showSuccessToast = (title, message) => {
    Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: title,
        textBody: message || '',
        autoClose: 3000,
    });
};

/**
 * Show an error toast notification
 * @param {string} title - The toast title
 * @param {string} message - The toast message (optional)
 */
export const showErrorToast = (title, message) => {
    Toast.show({
        type: ALERT_TYPE.DANGER,
        title: title,
        textBody: message || '',
        autoClose: 4000,
    });
};

/**
 * Show a warning toast notification
 * @param {string} title - The toast title
 * @param {string} message - The toast message (optional)
 */
export const showWarningToast = (title, message) => {
    Toast.show({
        type: ALERT_TYPE.WARNING,
        title: title,
        textBody: message || '',
        autoClose: 3500,
    });
};

/**
 * Show an info toast notification
 * @param {string} title - The toast title
 * @param {string} message - The toast message (optional)
 */
export const showInfoToast = (title, message) => {
    Toast.show({
        type: ALERT_TYPE.INFO,
        title: title,
        textBody: message || '',
        autoClose: 3000,
    });
};

/**
 * Show a toast with a specific type
 * @param {ALERT_TYPE} type - The alert type (SUCCESS, DANGER, WARNING, INFO)
 * @param {string} title - The toast title
 * @param {string} message - The toast message (optional)
 * @param {number} duration - Auto close duration in ms (optional, default 3000)
 */
export const showToast = (type, title, message, duration = 3000) => {
    Toast.show({
        type: type,
        title: title,
        textBody: message || '',
        autoClose: duration,
    });
};

/**
 * Show a confirmation dialog with a single button (e.g., "OK", "Great", etc.)
 * @param {Object} options - Dialog options
 * @param {ALERT_TYPE} options.type - The alert type (SUCCESS, DANGER, WARNING, INFO)
 * @param {string} options.title - The dialog title
 * @param {string} options.message - The dialog message
 * @param {string} options.buttonText - The button text (default: 'OK')
 * @param {Function} options.onPress - Callback when button is pressed
 */
export const showConfirmDialog = ({
    type = ALERT_TYPE.SUCCESS,
    title,
    message,
    buttonText = 'OK',
    onPress,
}) => {
    Dialog.show({
        type: type,
        title: title,
        textBody: message || '',
        button: buttonText,
        onPressButton: () => {
            Dialog.hide();
            onPress?.();
        },
    });
};

/**
 * Show a dialog with two action buttons (e.g., Cancel/Confirm, No/Yes)
 * Uses cancelButton for cancel action and button for confirm action
 * @param {Object} options - Dialog options
 * @param {ALERT_TYPE} options.type - The alert type (SUCCESS, DANGER, WARNING, INFO)
 * @param {string} options.title - The dialog title
 * @param {string} options.message - The dialog message
 * @param {string} options.confirmText - The confirm button text (default: 'Confirm')
 * @param {string} options.cancelText - The cancel button text (default: 'Cancel')
 * @param {Function} options.onConfirm - Callback when confirm is pressed
 * @param {Function} options.onCancel - Callback when cancel is pressed
 */
export const showActionDialog = ({
    type = ALERT_TYPE.WARNING,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonColor: customConfirmColor, // Optional override
    cancelButtonColor: customCancelColor, // Optional override
    onConfirm,
    onCancel,
}) => {
    // Both buttons are valid options - use primary for confirm, secondary dark for other option
    const confirmButtonColor = customConfirmColor || colors.primary;
    const cancelButtonColor = customCancelColor || '#35383F';

    Dialog.show({
        type: type,
        title: title,
        textBody: message || '',
        buttonOne: confirmText,
        buttonTwo: cancelText,
        buttonOneColor: confirmButtonColor,
        buttonTwoColor: cancelButtonColor,
        closeOnOverlayTap: true,
        autoClose: false,
        onPressButtonOne: () => {
            Dialog.hide();
            onConfirm?.();
        },
        onPressButtonTwo: () => {
            Dialog.hide();
            onCancel?.();
        },
        // onHide is only called when dialog closes - do NOT trigger any action
        // Actions should only be triggered by explicit button clicks
    });
};

/**
 * Show a success dialog with a single "Great" or "OK" button
 * Perfect for success messages like "Added to cart", "Saved successfully"
 * @param {string} title - The dialog title
 * @param {string} message - The dialog message
 * @param {string} buttonText - The button text (default: 'Great!')
 * @param {Function} onPress - Callback when button is pressed
 */
export const showSuccessDialog = (title, message, buttonText = 'Great!', onPress) => {
    Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: title,
        textBody: message || '',
        button: buttonText,
        onPressButton: () => {
            Dialog.hide();
            onPress?.();
        },
    });
};

/**
 * Show an error dialog with a single "OK" button
 * @param {string} title - The dialog title
 * @param {string} message - The dialog message
 * @param {Function} onPress - Callback when button is pressed
 */
export const showErrorDialog = (title, message, onPress) => {
    Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: title,
        textBody: message || '',
        button: 'OK',
        onPressButton: () => {
            Dialog.hide();
            onPress?.();
        },
    });
};

/**
 * Show a warning/confirmation dialog with action
 * @param {string} title - The dialog title
 * @param {string} message - The dialog message
 * @param {string} buttonText - The action button text
 * @param {Function} onPress - Callback when button is pressed
 */
export const showWarningDialog = (title, message, buttonText = 'OK', onPress) => {
    Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: title,
        textBody: message || '',
        button: buttonText,
        onPressButton: () => {
            Dialog.hide();
            onPress?.();
        },
    });
};

/**
 * Show an info dialog
 * @param {string} title - The dialog title
 * @param {string} message - The dialog message
 * @param {string} buttonText - The button text
 * @param {Function} onPress - Callback when button is pressed
 */
export const showInfoDialog = (title, message, buttonText = 'Got it', onPress) => {
    Dialog.show({
        type: ALERT_TYPE.INFO,
        title: title,
        textBody: message || '',
        button: buttonText,
        onPressButton: () => {
            Dialog.hide();
            onPress?.();
        },
    });
};

/**
 * Hide any currently showing dialog
 */
export const hideDialog = () => {
    Dialog.hide();
};

// Re-export ALERT_TYPE and Dialog for convenience
export { ALERT_TYPE, Dialog };

// Default export with all methods
export default {
    // Toasts (auto-dismiss, no interaction needed)
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
    show: showToast,

    // Dialogs (with buttons, require user interaction)
    successDialog: showSuccessDialog,
    errorDialog: showErrorDialog,
    warningDialog: showWarningDialog,
    infoDialog: showInfoDialog,
    confirmDialog: showConfirmDialog,
    actionDialog: showActionDialog,
    hideDialog: hideDialog,

    // Constants
    ALERT_TYPE,
    Dialog,
};
