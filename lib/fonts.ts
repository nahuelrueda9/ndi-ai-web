import { 
  Inter, 
  Poppins, 
  Montserrat, 
  Manrope, 
  DM_Sans, 
  Playfair_Display, 
  Lora, 
  Oswald 
} from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap' })
const lora = Lora({ subsets: ['latin'], display: 'swap' })
const oswald = Oswald({ subsets: ['latin'], display: 'swap' })

export const fontMap: Record<string, any> = {
  'inter': inter,
  'poppins': poppins,
  'montserrat': montserrat,
  'manrope': manrope,
  'dm-sans': dmSans,
  'playfair': playfair,
  'lora': lora,
  'oswald': oswald,
}

export const typographyOptions = [
  { value: 'inter', label: 'Inter — Moderna y limpia' },
  { value: 'poppins', label: 'Poppins — Moderna y amigable' },
  { value: 'montserrat', label: 'Montserrat — Fuerte y comercial' },
  { value: 'manrope', label: 'Manrope — Premium y minimalista' },
  { value: 'dm-sans', label: 'DM Sans — Simple y equilibrada' },
  { value: 'playfair', label: 'Playfair Display — Elegante' },
  { value: 'lora', label: 'Lora — Editorial y cálida' },
  { value: 'oswald', label: 'Oswald — Urbana y llamativa' },
]