/**
 * Translation hook for Lecturer Module
 * Hook dịch thuật cho Module Giảng viên
 */
import { vi } from '../i18n/vi'

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & (string | number)]

type TranslationPath = NestedKeyOf<typeof vi>

export function useTranslation() {
  const t = (
    path: TranslationPath,
    params?: Record<string, string | number>
  ): string => {
    const keys = path.split('.')
    let value: any = vi

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        console.warn(`Translation key not found: ${path}`)
        return path
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${path}`)
      return path
    }

    // Replace parameters in the translation string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key]?.toString() || match
      })
    }

    return value
  }

  return { t }
}
