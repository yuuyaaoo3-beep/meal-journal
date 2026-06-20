export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Gender = 'male' | 'female'

export interface UserGoal {
  id: string
  user_id: string
  age: number
  height: number
  weight: number
  gender: Gender
  activity: number
  goal_weight: number
  bmr: number
  tdee: number
  target_cal: number
  protein: number
  fat: number
  carbs: number
  is_premium: boolean
  created_at: string
}

export interface MealRecord {
  id: string
  user_id: string
  meal_type: MealType
  food_name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  recorded_at: string
  created_at: string
}

export interface WeightRecord {
  id: string
  user_id: string
  weight: number
  recorded_at: string
  created_at: string
}

export interface MyMeal {
  id: string
  user_id: string
  food_name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  created_at: string
}

export interface MyDish {
  id: string
  user_id: string
  dish_name: string
  meal_names: string
  calories: number
  protein: number
  fat: number
  carbs: number
  created_at: string
}

export interface ContactMessage {
  id: string
  user_id: string
  user_email: string
  category: string
  message: string
  status: 'open' | 'replied'
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export type Macros = { calories: number; protein: number; fat: number; carbs: number }
