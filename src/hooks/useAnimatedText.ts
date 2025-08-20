"use client";

import { animate, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { CHAT_ANIMATION_DURATION } from "@/lib/constants";

const delimiter = "";

export function useAnimatedText(text: string) {
  const animatedCursor = useMotionValue(0);
  const [cursor, setCursor] = useState(0);
  const [prevText, setPrevText] = useState(text);
  const [isSameText, setIsSameText] = useState(true);

  if (prevText !== text) {
    setPrevText(text);
    setIsSameText(text.startsWith(prevText));

    if (!text.startsWith(prevText)) {
      setCursor(0);
    }
  }

  useEffect(() => {
    if (!isSameText) {
      animatedCursor.jump(0);
    }

    const controls = animate(animatedCursor, text.split(delimiter).length, {
      duration: CHAT_ANIMATION_DURATION / 1000, // Convert ms to seconds
      ease: "easeOut",
      onUpdate(latest) {
        setCursor(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [animatedCursor, isSameText, text]);

  return text.split(delimiter).slice(0, cursor).join(delimiter);
}