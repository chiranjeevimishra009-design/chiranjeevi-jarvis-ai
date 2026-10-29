export const formatDate = (value: string | Date) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

export function titleFromMessage(message: string) {
  const cleaned = message.trim().replace(/\s+/g, ' ');
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}...` : cleaned || 'New Chat';
}
