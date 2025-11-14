'use server'
import {auth} from "@/lib/better-auth";
import { inngest } from "../inngest/client";


type SignUpFormData = {
    fullName: string;
    email: string;
    password: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
};

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try{
        const response = await auth?.api.signUpEmail({ body: { email, password, name: fullName } })
        console.log(response)
        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }else{
            throw new Error('Sign up response is null')
        }

        return { success: true, data: response }
    }   catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    } 
}