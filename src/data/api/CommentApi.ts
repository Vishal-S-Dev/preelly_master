import { API_ENDPOINTS } from '../../constants/appConstants';
import { CommentDTO } from '../dto/CommentDTO';
import { httpClient } from './httpClient';

const mockComments = (productId: string): CommentDTO[] => {
  const now = Date.now();
  return [
    {
      _id: `${productId}_c1`,
      text: 'Is this still available? Looks great 🔥',
      createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      user: {
        _id: 'u1',
        name: 'ahmad_shaikh',
        avatar: 'https://i.pravatar.cc/200?img=11',
      },
      likeCount: 12,
      replyCount: 1,
      replies: [
        {
          _id: `${productId}_c1_r1`,
          text: 'Yes, still available. DM for details.',
          createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
          user: {
            _id: 'seller',
            name: 'preelly_seller',
            avatar: 'https://i.pravatar.cc/200?img=5',
          },
          isOwner: true,
          likeCount: 3,
        },
      ],
    },
    {
      _id: `${productId}_c2`,
      text: 'Price negotiable? 😍',
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      user: {
        _id: 'u2',
        name: 'ashly_poul',
        avatar: 'https://i.pravatar.cc/200?img=22',
      },
      likeCount: 8,
    },
    {
      _id: `${productId}_c3`,
      text: 'Clean ride 🚗✨',
      createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      user: {
        _id: 'u3',
        name: 'mike_rides',
        avatar: 'https://i.pravatar.cc/200?img=33',
      },
      likeCount: 5,
    },
  ];
};

const mapResponseList = (payload: unknown): CommentDTO[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: CommentDTO[] }).data)) {
    return (payload as { data: CommentDTO[] }).data;
  }
  return [];
};

export const CommentApi = {
  async getComments(productId: string): Promise<CommentDTO[]> {
    try {
      const { data } = await httpClient.get<unknown>(
        `${API_ENDPOINTS.PRODUCT_COMMENTS}/${productId}/comments`,
      );
      return mapResponseList(data);
    } catch {
      await new Promise(resolve => setTimeout(resolve, 350));
      return mockComments(productId);
    }
  },

  async addComment(productId: string, text: string): Promise<CommentDTO> {
    try {
      const { data } = await httpClient.post<CommentDTO | { data: CommentDTO }>(
        `${API_ENDPOINTS.PRODUCT_COMMENTS}/${productId}/comments`,
        { text },
      );
      if (data && typeof data === 'object' && 'data' in data && data.data) {
        return data.data;
      }
      return data as CommentDTO;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
      return {
        _id: `local_${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        user: { _id: 'local_user', name: 'You', avatar: 'https://i.pravatar.cc/200?img=8' },
        likeCount: 0,
      };
    }
  },

  async likeComment(
    commentId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const { data } = await httpClient.post<{ liked?: boolean; likeCount?: number; data?: { liked?: boolean; likeCount?: number } }>(
        `${API_ENDPOINTS.COMMENT_LIKE}/${commentId}/like`,
      );
      const payload = data?.data ?? data;
      return {
        liked: Boolean(payload?.liked),
        likeCount: typeof payload?.likeCount === 'number' ? payload.likeCount : 0,
      };
    } catch {
      return { liked: true, likeCount: 0 };
    }
  },
};
