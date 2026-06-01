export const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export const relativeAge = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return '1 day ago';
  }
  return `${days} days ago`;
};
