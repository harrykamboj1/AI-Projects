'use server'
import { headers } from "next/headers";
import { auth } from "../better-auth";
import { redirect } from "next/navigation";
import Watchlist from "../models/WatchList";
import { revalidatePath } from "next/cache";

export const addToWatchList = async (symbol: string,company:string) => {
    try{
        const session = await auth.api.getSession({
            headers:await headers(),
        })

        if (!session?.user) redirect('/sign-in');

        const existingOne = await Watchlist.findOne({
            userId:session.user.id,
            symbol:symbol.toUpperCase()
        })
        if (existingOne) {
            return { success: false, error: 'Stock already in watchlist' };
          }

          const newItem = new Watchlist({
            userId: session.user.id,
            symbol: symbol.toUpperCase(),
            company: company.trim(),
            email:session.user.email
          });
          console.log("Watchlist save success")
          const res = await newItem.save();
          console.log(res)
          revalidatePath('/watchlist');

    return { success: true, message: 'Stock added to watchlist' };
    }catch(error){
        console.error("Error adding to watchlist:", error);
        throw new Error('Failed to add stock to watchlist');
    }
}

export const removeFromWatchlist = async (symbol: string) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) redirect('/sign-in');
  
      await Watchlist.deleteOne({
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
      });

      console.log("Watchlist delete success")

      revalidatePath('/watchlist');
  
      return { success: true, message: 'Stock removed from watchlist' };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw new Error('Failed to remove stock from watchlist');
    }
  };

  export const getWatchlistSymbolsByEmail = async (email:string) =>{
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) redirect('/sign-in');
  
      const list = await Watchlist.find(
        {
          userId: session.user.id,
          email: email,
        }
      ).select("symbol");

      console.log("Watchlist find success")
  
      return { success: true, message: ' watchlist fetched successfully',list:list };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw new Error('Failed to remove stock from watchlist');
    }
  }


  export const getUserWatchlist = async () => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) redirect('/sign-in');
  
      const watchlist = await Watchlist.find({ userId: session.user.id })
        .sort({ addedAt: -1 })
        .lean();
  
      return JSON.parse(JSON.stringify(watchlist));
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw new Error('Failed to fetch watchlist');
    }
  }