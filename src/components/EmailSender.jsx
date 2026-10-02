import { EMAIL_SENDER_NAME, EMAIL_SENDER_ADDRESS } from '../config.js';

// Who the sign-in email comes from, so it's easy to find in the inbox.
export function EmailSender() {
  return (
    <div className="email-sender">
      <span>המייל יגיע מהשולח:</span>
      <strong dir="ltr">{EMAIL_SENDER_NAME}</strong>
      <span className="addr" dir="ltr">{EMAIL_SENDER_ADDRESS}</span>
      <span className="hint">אפשר לחפש בתיבת המייל: <bdi dir="ltr">{EMAIL_SENDER_NAME.split(' ')[0]}</bdi></span>
    </div>
  );
}
