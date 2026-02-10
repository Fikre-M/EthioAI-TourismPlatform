import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/Button";
import { Product } from "../pages/MarketplacePage";
import { addToCart } from "@store/slices/bookingSlice";
import { BookingItem } from "@/types/booking";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Clock, Check, Gift, Truck, Flag, Flame } from "lucide-react";
import {
  FaHeart as FaHeartSolid,
  FaRegHeart,
  FaShoppingCart,
  FaStar,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  onWishlistToggle?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onClick?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode,
  onWishlistToggle,
  onAddToCart,
  onClick,
}) => {
  const dispatch = useDispatch();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleImageError = () => {
    setIsImageLoading(false);
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWishlistToggle?.(product.id);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const bookingItem: BookingItem = {
      id: `product-${product.id}-${Date.now()}`,
      tourId: product.id,
      tourName: product.name,
      tourImage: product.images[0] || "/placeholder-product.jpg",
      date: new Date().toISOString().split("T")[0],
      participants: {
        adults: 1,
        children: 0,
      },
      pricePerAdult: product.price,
      pricePerChild: 0,
      addOns: [],
      totalPrice: product.price,
      meetingPoint: product.vendor.location,
      duration: "Product",
      specialRequests: "",
    };

    dispatch(addToCart(bookingItem));
    onAddToCart?.(product.id);
  };

  const getAvailabilityStatus = () => {
    switch (product.availability) {
      case "in-stock":
        return {
          icon: <Check className="h-4 w-4 text-green-600" />,
          text: "In Stock",
          color: "text-green-600",
        };
      case "limited":
        return {
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          text: "Limited Stock",
          color: "text-yellow-600",
        };
      case "out-of-stock":
        return {
          icon: <FaExclamationTriangle className="h-4 w-4 text-red-600" />,
          text: "Out of Stock",
          color: "text-red-600",
        };
      default:
        return {
          icon: <Check className="h-4 w-4 text-green-600" />,
          text: "Available",
          color: "text-green-600",
        };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const availabilityStatus = getAvailabilityStatus();

  // Grid view - Improved and attractive
  return (
    <div
      onClick={() => onClick?.(product.id)}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-visible group h-full flex flex-col relative hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl">
        {isImageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        )}
        <img
          src={product.images[currentImageIndex] || "/placeholder-product.jpg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Badges - Moved to bottom of image to not cover title */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-start gap-1.5 max-w-[calc(100%-6rem)] z-20">
          {product.madeInEthiopia && (
            <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-semibold px-2.5 py-1 shadow-lg backdrop-blur-sm">
              <Flag className="h-3 w-3 mr-1" />
              Made in Ethiopia
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold px-2.5 py-1 shadow-lg backdrop-blur-sm">
              <Flame className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-2.5 py-1 shadow-lg backdrop-blur-sm">
              <Gift className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
          {product.discount && (
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2.5 py-1 shadow-lg backdrop-blur-sm">
              -{product.discount}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-2.5 bg-white/95 dark:bg-gray-900/95 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-lg hover:scale-110 z-20"
          aria-label={product.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {product.isWishlisted ? (
            <FaHeartSolid className="text-red-500 h-5 w-5" />
          ) : (
            <FaRegHeart className="text-gray-600 dark:text-gray-300 h-5 w-5" />
          )}
        </button>

        {/* Image Navigation */}
        {product.images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handlePrevImage}
              className="bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-white rounded-full p-2.5 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-lg hover:scale-110"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              className="bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-white rounded-full p-2.5 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-lg hover:scale-110"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Vendor Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-xs font-bold text-white">
                {product.vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {product.vendor.name}
              </p>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {product.vendor.location}
                </span>
                {product.vendor.verified && (
                  <FaShieldAlt className="text-blue-500 h-3 w-3 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <FaStar className="text-yellow-400 h-4 w-4" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {product.rating}
            </span>
          </div>
        </div>

        {/* Product Name - Always fully visible */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Features/Tags */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {product.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full whitespace-nowrap"
              >
                {feature}
              </span>
            ))}
            {product.features.length > 3 && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                +{product.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              {product.originalPrice && (
                <span className="text-gray-500 dark:text-gray-400 line-through text-sm">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {formatPrice(product.price)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {availabilityStatus.icon}
              <span className={`text-xs font-semibold ${availabilityStatus.color}`}>
                {availabilityStatus.text}
              </span>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-orange-500" />
              <span className="font-medium">
                {product.shipping.free ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">Free shipping</span>
                ) : (
                  formatPrice(product.shipping.cost || 0)
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{product.shipping.estimatedDays} days</span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCartClick}
            disabled={product.availability === "out-of-stock"}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 py-2.5"
          >
            <FaShoppingCart className="mr-2 h-4 w-4" />
            {product.availability === "out-of-stock" ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
