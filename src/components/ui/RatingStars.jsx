import { FaRegStar, FaStar } from 'react-icons/fa6'

export default function RatingStars({ value, className = '', size = 12 }) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        index < value
          ? <FaStar key={index} size={size} />
          : <FaRegStar key={index} size={size} />
      ))}
    </span>
  )
}