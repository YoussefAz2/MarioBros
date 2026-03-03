import { supabase } from '../lib/supabase';

export interface MapData {
  id: number | string;
  title: string;
  description: string;
  author: string;
  likes: number;
  created_at: string;
  image: string | null;
  user_id?: string;
  data?: any;
}

export const dbService = {
  async getMaps(): Promise<MapData[]> {
    const { data, error } = await supabase
      .from('maps')
      .select('id, title, description, author, likes, created_at, image, user_id')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async publishMap(mapData: Omit<MapData, 'id' | 'likes' | 'created_at'>): Promise<void> {
    let finalImageUrl = mapData.image;

    // Convert Base64 from Canvas into a File/Blob and upload to Supabase Storage
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
        }
      } catch (e) {
        console.warn('Failed to upload map preview to Storage, using original or null', e);
      }
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

  async updateMap(id: string | number, mapData: Partial<Omit<MapData, 'id' | 'likes' | 'created_at' | 'author' | 'user_id' | 'data'>>): Promise<void> {
    let finalImageUrl = mapData.image;

    // Convert Base64 into a File/Blob and upload to Supabase Storage if it's a new edited image
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
        }
      } catch (e) {
        console.warn('Failed to upload map preview to Storage, using original or null', e);
      }
    }

    const mapDataToUpdate = { ...mapData };
    if (finalImageUrl !== undefined) {
      mapDataToUpdate.image = finalImageUrl;
    }

    const { error } = await supabase
      .from('maps')
      .update(mapDataToUpdate)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMap(id: string | number): Promise<void> {
    const { error } = await supabase.from('maps').delete().eq('id', id);
    if (error) throw error;
  }
};
