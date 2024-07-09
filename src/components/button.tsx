import { ActivityIndicator, Text, TextProps, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { createContext, useContext } from "react";
import clsx from "clsx";

type Variants = 'primary' | 'secondary'

type ButtonProps = TouchableOpacityProps & {
  variant?: Variants
  isLoading?: boolean
}

const ThemeContext = createContext<{ variant?: Variants }>({})

function Button({ variant = 'primary', children, isLoading, ...rest }: ButtonProps) {
  return (
    <TouchableOpacity
      className={clsx(
        "w-full h-11 flex-row items-center justify-center rounded-lg gap-2",
        {
          "bg-orange-400": variant === 'primary',
          "bg-zinc-600": variant === 'secondary'
        }
      )}
      activeOpacity={0.7}
      disabled={isLoading}
      {...rest}
    >
      <ThemeContext.Provider value={{ variant }}>
        {isLoading ? <ActivityIndicator className="text-orange-950" /> : children}
      </ThemeContext.Provider>
    </TouchableOpacity>
  )
}

function Title({ children }: TextProps) {
  const { variant } = useContext(ThemeContext)

  return <Text className={clsx(
    'text-base font-semibold',
    {
      "text-orange-950": variant === "primary",
      "text-zinc-200": variant === 'secondary'
    }
  )}>
    {children}
  </Text>
}

Button.Title = Title

export { Button }
