import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvxfvpecsxuadngoytxl.supabase.co' // Ex: https://xxxxx.supabase.co
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2eGZ2cGVjc3h1YWRuZ295dHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDA4NzQsImV4cCI6MjEwNDI3Njg3NH0.ZHjn0oIl-2cXX5Z9bF_SR5zklOAHHC3ODs4-8Cj9LGg' // A chave pública

export const supabase = createClient(supabaseUrl, supabaseKey)