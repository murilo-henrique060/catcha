'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUserProfile } from "@/lib/controllers/UserController";

export type UserProfileData = {
  profile: {
    id: string;
    username: string;
    money: number;
    cards_drawn: number;
    cards_traded: number;
    cards_sold: number;
    cards_bought: number;
    next_draw: string;
    created_at: string;
    updated_at: string;
  } | null;
  email: string | null;
  items: {
    quantity: number;
    item: {
      id: number;
      name: string;
      type: string;
      description: string;
      image_url: string;
      price: number;
    };
  }[];
  cards: {
    quantity: number;
    cat: {
      id: number;
      name: string;
      rarity: string;
      image_path: string;
    };
  }[];
  currentExchange: {
    sender_id: string;
    receiver_id: string;
    sender_cat_id: number;
    receiver_cat_id: number | null;
    status: string;
    created_at: string;
    updated_at: string;
  } | null;
  notifications: {
    pendingFriendRequests: number;
    activeTradesCount: number;
    pendingGiftsCount: number;
    total: number;
  };
};

type UserContextType = UserProfileData & {
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateCoins: (amount: number) => void;
  setProfileData: React.Dispatch<React.SetStateAction<UserProfileData>>;
};

const defaultProfileData: UserProfileData = {
  profile: null,
  email: null,
  items: [],
  cards: [],
  currentExchange: null,
  notifications: {
    pendingFriendRequests: 0,
    activeTradesCount: 0,
    pendingGiftsCount: 0,
    total: 0,
  }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profileData, setProfileData] = useState<UserProfileData>(defaultProfileData);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getUserProfile();
        if (!active) return;
        if (data) {
          setProfileData({
            profile: data.profile,
            email: data.email,
            items: data.items as unknown as UserProfileData['items'],
            cards: data.cards as unknown as UserProfileData['cards'],
            currentExchange: data.currentExchange as unknown as UserProfileData['currentExchange'],
            notifications: data.notifications as unknown as UserProfileData['notifications'],
          });
        } else {
          setProfileData(defaultProfileData);
        }
      } catch (error) {
        console.error("Failed to load user profile context:", error);
        if (active) {
          setProfileData(defaultProfileData);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const refreshProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      if (data) {
        setProfileData({
          profile: data.profile,
          email: data.email,
          items: data.items as unknown as UserProfileData['items'],
          cards: data.cards as unknown as UserProfileData['cards'],
          currentExchange: data.currentExchange as unknown as UserProfileData['currentExchange'],
          notifications: data.notifications as unknown as UserProfileData['notifications'],
        });
      } else {
        setProfileData(defaultProfileData);
      }
    } catch (error) {
      console.error("Failed to refresh user profile context:", error);
      setProfileData(defaultProfileData);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoins = (amount: number) => {
    setProfileData((prev) => {
      if (!prev.profile) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          money: amount,
        },
      };
    });
  };

  return (
    <UserContext.Provider
      value={{
        ...profileData,
        isLoading,
        refreshProfile,
        updateCoins,
        setProfileData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
