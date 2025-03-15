import { motion } from "framer-motion";
import Link from "next/link";

import { MessageIcon, VercelIcon } from "./icons";

import happyFavicon from "@/static_assets/happy_favicon.png";
import Image from "next/image";

/*
export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <VercelIcon size={32} />
          <span>+</span>
          <MessageIcon size={32} />
        </p>
        <p>
          This is an{' '}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://github.com/vercel/ai-chatbot"
            target="_blank"
          >
            open source
          </Link>{' '}
          chatbot template built with Next.js and the AI SDK by Vercel. It uses
          the{' '}
          <code className="rounded-md bg-muted px-1 py-0.5">streamText</code>{' '}
          function in the server and the{' '}
          <code className="rounded-md bg-muted px-1 py-0.5">useChat</code> hook
          on the client to create a seamless chat experience.
        </p>
        <p>
          You can learn more about the AI SDK by visiting the{' '}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://sdk.vercel.ai/docs"
            target="_blank"
          >
            docs
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
*/

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center max-w-xl">
        <div className="flex flex-row justify-center items-center m-4">
          <div className="bg-white rounded-full m-2 p-2 size-[120px] flex flex-row justify-center items-center border-2 border-gray-300">
            <Image
              alt="Favicon Mascot"
              // src="https://img.freepik.com/premium-vector/dolphin-vector-icon-dolphin-illustration-sign-dolphin-symbol-logo_186686-759.jpg"
              // src="https://cdn-icons-png.flaticon.com/512/427/427463.png"
              src={happyFavicon}
              className="size-[100px] object-contain"
              style={{
                width: "100px",
                // transform: "scaleX(-1) translateX(-5px)",
                // transform: "translateX(0px)",
              }}
              referrerPolicy="no-referrer"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
          </div>
        </div>

        <p>
          <strong>Favicon</strong> is a curious dolphin who can answer almost
          any question!
        </p>
        <p>Ask him anything, and he will do his best to answer.</p>
      </div>
    </motion.div>
  );
};
