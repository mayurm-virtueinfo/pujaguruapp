import { Message } from '../screens/Users/UserChatScreen/UserChatScreen';

export const LOCATION_UPDATED_EVENT = 'LOCATION_UPDATED';

const parseIncomingTime = (timestamp?: string): string => {
  if (timestamp) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const handleIncomingMessage = (
  prevMessages: Message[],
  data: any,
  myUserId: any,
): Message[] => {
  const msgTime = parseIncomingTime(data?.timestamp);
  const msgText = data?.message || data?.content || '';
  const msgId = data?.uuid || data?.id || `msg-${Date.now()}`;
  const isOwn =
    String(data?.sender_id) === String(myUserId) ||
    String(data?.sender) === String(myUserId);

  // 1️⃣ Find the temporary message
  const tempMsg = prevMessages.find(msg => String(msg.id).startsWith('temp-'));

  if (tempMsg) {
    // 2️⃣ Replace the temp message with the real one from server
    return prevMessages.map(msg =>
      msg.id === tempMsg.id
        ? {
            id: msgId,
            text: msgText,
            time: msgTime,
            isOwn,
          }
        : msg,
    );
  }

  // 3️⃣ If no temp found, just append the new message
  const newMsg: Message = {
    id: msgId,
    text: msgText,
    time: msgTime,
    isOwn,
  };

  return [...prevMessages, newMsg];
};

/**
 * Get city name from coordinates using OpenStreetMap (Nominatim).
 * @param lat Latitude
 * @param lon Longitude
 */
export const getCityName = async (
  lat: number,
  lon: number,
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'PujaGuruApp/1.0', // Required by Nominatim
        },
      },
    );
    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;
      // Prioritize city-level names.
      let city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb;

      // If strict city fail, try broader regions but clean them
      if (!city) {
        // Prioritize county (often Taluka/Tehsil) over state_district
        // for better local recognition if explicit city field is missing.
        const broader = addr.county || addr.state_district;
        if (broader) {
          city = broader.replace(/\s(District|Region|Taluka|Mandal)$/i, '');
        }
      }

      return city || null;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching city name:', error);
    return null;
  }
};
