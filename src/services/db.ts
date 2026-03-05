import { supabase } from '../lib/supabase';

export interface MapData {
  id: number | string;
  title: string;
  description: string;
  data: string; // JSON string
  likes: number;
  created_at: string;
  user_id: string; // Supabase user ID
  author: string | null;
  image: string | null;
  is_published?: boolean;
}

export interface ScoreData {
  id: string;
  map_id: number | string;
  user_id: string;
  username: string;
  time_elapsed: number;
  created_at: string;
}

export const dbService = {
  async getMaps(): Promise<MapData[]> {
    const { data, error } = await supabase
      .from('maps')
      .select('id, title, description, data, likes, created_at, user_id, author, image')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async publishMap(mapData: Omit<MapData, 'id' | 'likes' | 'created_at' | 'user_id'>): Promise<void> {
    let finalImageUrl: string | null = null;

    if (mapData.image && mapData.image.startsWith('data:image')) {
      try {
        const res = await fetch(mapData.image);
        const blob = await res.blob();
        const fileName = `map-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('maps_images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data } = supabase.storage.from('maps_images').getPublicUrl(fileName);
          finalImageUrl = data.publicUrl;
        } else {
          console.error("Storage upload error:", uploadError);
          finalImageUrl = mapData.image; // Fallback to base64
        }
      } catch (e) {
        console.warn('Failed to upload map preview to Storage', e);
        finalImageUrl = mapData.image; // Fallback to base64
      }
    } else if (mapData.image && !mapData.image.startsWith('data:image')) {
      finalImageUrl = mapData.image;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user_id = sessionData?.session?.user?.id;

    const mapDataToInsert = { ...mapData, image: finalImageUrl, user_id };

    const { error } = await supabase
      .from('maps')
      .insert([mapDataToInsert]);

    if (error) throw error;
  },

  async getMap(id: string | number): Promise<MapData> {
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async likeMap(id: string | number): Promise<void> {
    const { data } = await supabase.from('maps').select('likes').eq('id', id).single();
    if (data) {
      const { error } = await supabase.from('maps').update({ likes: data.likes + 1 }).eq('id', id);
      if (error) throw error;
    }
  },

  async updateMapWithImage(id: string | number, updates: Partial<Omit<MapData, 'id' | 'likes' | 'created_at' | 'data' | 'user_id' | 'author'>>) {
    let finalImageUrl = updates.image;

    if (updates.image && updates.image.startsWith('data:image')) {
      try {
        const res = await fetch(updates.image);
        const blob = await res.blob();
        const fileName = `map-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('maps_images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('maps_images')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error("Error uploading updated image:", err);
        finalImageUrl = updates.image; // Fallback to base64
      }
    }

    const { data, error } = await supabase
      .from('maps')
      .update({ title: updates.title, description: updates.description, image: finalImageUrl })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMap(id: string | number): Promise<void> {
    const { error } = await supabase.from('maps').delete().eq('id', id);
    if (error) throw error;
  },

  async getTopScores(mapId: string | number): Promise<ScoreData[]> {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('map_id', mapId)
      .order('time_elapsed', { ascending: true })
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  async submitScore(mapId: string | number, timeElapsed: number, userId: string, username: string) {
    const { data, error } = await supabase
      .from('scores')
      .insert([
        { map_id: mapId, time_elapsed: timeElapsed, user_id: userId, username }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
