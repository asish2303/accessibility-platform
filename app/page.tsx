"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  allowedNeeds,
  classifyQuery,
  difficultyOptions,
  type Need,
  type SupportType,
} from "@/lib/smart-match";

type Language = "en" | "ml";

const needs = [
  {
    id: "hearing" as Need,
    icon: "◌",
    title: "Hearing",
    mlTitle: "കേൾവി",
    description: "Support for hearing, listening and communication.",
    mlDescription: "കേൾവി, ശ്രവണം, ആശയവിനിമയം എന്നിവയ്ക്കുള്ള സഹായം.",
    tone: "from-violet-500 to-fuchsia-600",
  },
  {
    id: "vision" as Need,
    icon: "◉",
    title: "Vision",
    mlTitle: "കാഴ്ച",
    description:
      "Support for visual difficulties and everyday activities.",
    mlDescription:
      "കാഴ്ചയുമായി ബന്ധപ്പെട്ട ബുദ്ധിമുട്ടുകൾക്കും ദൈനംദിന പ്രവർത്തനങ്ങൾക്കും സഹായം.",
    tone: "from-cyan-500 to-blue-600",
  },
  {
    id: "mobility" as Need,
    icon: "♿",
    title: "Mobility",
    mlTitle: "ചലനം",
    description: "Support for walking, standing and moving around.",
    mlDescription: "നടക്കാനും നിൽക്കാനും സഞ്ചരിക്കാനും സഹായം.",
    tone: "from-emerald-500 to-teal-600",
  },
  {
    id: "communication" as Need,
    icon: "◒",
    title: "Communication",
    mlTitle: "ആശയവിനിമയം",
    description:
      "Support for speaking and communicating with others.",
    mlDescription:
      "സംസാരിക്കാനും മറ്റുള്ളവരുമായി ആശയവിനിമയം നടത്താനും സഹായം.",
    tone: "from-orange-400 to-rose-500",
  },
];

type SupportResource = {
  id: number;
  _distanceKm?: number | null;
  title: string;
  mlTitle: string;
  description: string;
  mlDescription: string;
  need: Need;
  difficulty: string[];
  supportType: SupportType;
  category: string;
  isDemo: boolean;
  verified: boolean;

  sourceUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;

  location?: string | null;
  mlLocation?: string | null;

  eligibility?: string | null;
  mlEligibility?: string | null;

  applicationInfo?: string | null;
  mlApplicationInfo?: string | null;

  verificationSource?: string | null;
  mlVerificationSource?: string | null;

  verifiedAt?: string | null;
  latitude: number | null;
  longitude: number | null;
  locationType: "physical" | "nationwide";
  requiredDocuments: string[];
  mlRequiredDocuments: string[];
};

const difficulties: Record<Need, string[]> = difficultyOptions;

const difficultyMalayalam: Record<string, string> = {
  "Hearing conversations": "സംഭാഷണങ്ങൾ കേൾക്കുക",
  "Hearing alerts": "അറിയിപ്പുകൾ കേൾക്കുക",
  "Following group conversations": "കൂട്ടായ സംഭാഷണങ്ങൾ പിന്തുടരുക",
  "Listening to media": "മീഡിയ കേൾക്കുക",
  Reading: "വായന",
  "Seeing objects": "വസ്തുക്കൾ കാണുക",
  "Moving around safely": "സുരക്ഷിതമായി സഞ്ചരിക്കുക",
  "Recognizing people": "ആളുകളെ തിരിച്ചറിയുക",
  Walking: "നടക്കുക",
  Standing: "നിൽക്കുക",
  "Moving outdoors": "പുറത്ത് സഞ്ചരിക്കുക",
  "Moving indoors": "അകത്ത് സഞ്ചരിക്കുക",
  Speaking: "സംസാരിക്കുക",
  "Expressing needs": "ആവശ്യങ്ങൾ പ്രകടിപ്പിക്കുക",
  "Communicating with others": "മറ്റുള്ളവരുമായി ആശയവിനിമയം നടത്തുക",
  "Using a communication device": "ആശയവിനിമയ ഉപകരണം ഉപയോഗിക്കുക",
};

const categoryMalayalam: Record<string, string> = {
  "Vision Support": "കാഴ്ച സഹായം",
  "Hearing Support": "ശ്രവണ സഹായം",
  "Mobility Support": "ചലന സഹായം",
  "Communication Support": "ആശയവിനിമയ സഹായം",
  "Government Support": "സർക്കാർ സഹായം",
  "Support Service": "സഹായ സേവനം",
  "Repair Service": "റിപ്പയർ സേവനം",
};

const supportOptions = [
  {
    id: "assistive-device" as SupportType,
    icon: "✦",
    title: "Assistive Devices",
    mlTitle: "സഹായ ഉപകരണങ്ങൾ",
    description:
      "Explore devices and equipment that may help with your daily activities.",
    mlDescription:
      "ദൈനംദിന പ്രവർത്തനങ്ങളിൽ സഹായിക്കുന്ന ഉപകരണങ്ങൾ കണ്ടെത്തുക.",
  },
  {
    id: "government" as SupportType,
    icon: "⌂",
    title: "Government Support",
    mlTitle: "സർക്കാർ സഹായം",
    description: "Explore schemes, benefits and support programs.",
    mlDescription:
      "പദ്ധതികളും ആനുകൂല്യങ്ങളും സഹായ പരിപാടികളും കണ്ടെത്തുക.",
  },
  {
    id: "provider" as SupportType,
    icon: "＋",
    title: "Service Providers",
    mlTitle: "സേവന ദാതാക്കൾ",
    description:
      "Find organizations and professionals who can provide assistance.",
    mlDescription:
      "സഹായം നൽകുന്ന സ്ഥാപനങ്ങളെയും പ്രൊഫഷണലുകളെയും കണ്ടെത്തുക.",
  },
  {
    id: "repair" as SupportType,
    icon: "⌁",
    title: "Repair Services",
    mlTitle: "റിപ്പയർ സേവനങ്ങൾ",
    description:
      "Find repair and maintenance services for assistive devices.",
    mlDescription:
      "സഹായ ഉപകരണങ്ങൾക്കുള്ള റിപ്പയർ, പരിപാലന സേവനങ്ങൾ കണ്ടെത്തുക.",
  },
];

const text = {
  en: {
    badge: "Malayalam + English Accessibility Platform",
    heroTitle: "Find the support you need.",
    heroText:
      "ACCESS+ helps people discover assistive devices, government support, service providers and repair services through a simple guided experience.",
    start: "Start Finding Support",
    finder: "Personalised Support Finder",
    finderTitle: "Let's find the right support",
    finderText:
      "Answer a few simple questions and ACCESS+ will prepare a support search for you.",
    question1: "What area do you need help with?",
    question2: "What is your main difficulty?",
    question2Text:
      "Choose the option that best describes your situation.",
    question3: "What kind of support are you looking for?",
    question3Text:
      "Choose the type of help you want to explore.",
    back: "Back",
    ready: "Search Ready",
    profile: "Your support profile",
    readyText:
      "We have enough information to start finding relevant support for you.",
    find: "Find Support",
    again: "Start Again",
    change: "Change previous answer",
    brandTagline: "Support made accessible",
    simpleStep: "Simple step-by-step",
    malayalamSupport: "Malayalam support",
    accessibilityFocused: "Accessibility focused",
    heroVisualTitle: "Find your support",
    personalized: "PERSONALIZED",
    supportMadeSimple: "Support made simple",
    step01: "STEP 01",
    step02: "Step 02",
    step03: "Step 03",
    howItWorks: "How ACCESS+ works",
    supportWithoutConfusion: "Support without the confusion",
    guidedExperience:
      "A simple guided experience designed to make finding accessibility support easier.",

    tellUsNeed: "Tell us what you need",
    tellUsNeedDescription:
      "Choose Hearing, Vision, Mobility or Communication.",

    chooseSupport: "Choose your support",
    chooseSupportDescription:
      "Select a device, government support, provider or repair service.",

    getResults: "Get relevant results",
    getResultsDescription:
      "Use your answers to discover useful support information.",

    assistiveDevices: "Assistive Devices",
    assistiveDevicesDescription:
      "Explore equipment that can support everyday life.",

    governmentSupport: "Government Support",
    governmentSupportDescription:
      "Make government support easier to discover.",

    serviceProviders: "Service Providers",
    serviceProvidersDescription:
      "Connect people with relevant support services.",

    repairs: "Repairs",
    repairsDescription:
      "Find repair and maintenance support.",

    footerTagline: "Support made accessible · Malayalam + English",
  },

  ml: {
    badge: "മലയാളം + ഇംഗ്ലീഷ് ആക്സസിബിലിറ്റി പ്ലാറ്റ്ഫോം",
    heroTitle: "നിങ്ങൾക്ക് ആവശ്യമുള്ള സഹായം കണ്ടെത്തൂ.",
    heroText:
      "സഹായ ഉപകരണങ്ങൾ, സർക്കാർ സഹായം, സേവന ദാതാക്കൾ, റിപ്പയർ സേവനങ്ങൾ എന്നിവ എളുപ്പത്തിൽ കണ്ടെത്താൻ ACCESS+ സഹായിക്കുന്നു.",
    start: "സഹായം കണ്ടെത്താം",
    finder: "വ്യക്തിഗത സഹായ കണ്ടെത്തൽ",
    finderTitle: "ശരിയായ സഹായം കണ്ടെത്താം",
    finderText:
      "ചില ലളിതമായ ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകൂ. നിങ്ങൾക്കായി ഒരു സഹായ തിരയൽ തയ്യാറാക്കാം.",
    question1: "ഏത് മേഖലയിലാണ് നിങ്ങൾക്ക് സഹായം ആവശ്യം?",
    question2: "നിങ്ങളുടെ പ്രധാന ബുദ്ധിമുട്ട് എന്താണ്?",
    question2Text:
      "നിങ്ങളുടെ സാഹചര്യത്തെ ഏറ്റവും നന്നായി വിവരിക്കുന്ന ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക.",
    question3: "ഏത് തരത്തിലുള്ള സഹായമാണ് നിങ്ങൾ അന്വേഷിക്കുന്നത്?",
    question3Text:
      "നിങ്ങൾക്ക് ആവശ്യമുള്ള സഹായത്തിന്റെ തരം തിരഞ്ഞെടുക്കുക.",
    back: "പിന്നിലേക്ക്",
    ready: "തിരയാൻ തയ്യാറാണ്",
    profile: "നിങ്ങളുടെ സഹായ പ്രൊഫൈൽ",
    readyText:
      "നിങ്ങൾ അന്വേഷിക്കുന്നത് ഞങ്ങൾക്ക് മനസ്സിലായി. ഇനി സഹായം കണ്ടെത്താം.",
    find: "സഹായം കണ്ടെത്തുക",
    again: "വീണ്ടും തുടങ്ങുക",
    change: "മുമ്പത്തെ ഉത്തരം മാറ്റുക",
    brandTagline: "എല്ലാവർക്കും എളുപ്പത്തിൽ ലഭ്യമാകുന്ന സഹായം",
    simpleStep: "ലളിതമായ ഘട്ടംഘട്ടമായ പ്രക്രിയ",
    malayalamSupport: "മലയാളം പിന്തുണ",
    accessibilityFocused: "ആക്സസിബിലിറ്റിക്ക് മുൻഗണന",
    heroVisualTitle: "നിങ്ങളുടെ സഹായം കണ്ടെത്തൂ",
    personalized: "വ്യക്തിഗതമായി",
    supportMadeSimple: "സഹായം എളുപ്പത്തിൽ",
    step01: "ഘട്ടം 01",
    step02: "ഘട്ടം 02",
    step03: "ഘട്ടം 03",
    howItWorks: "ACCESS+ എങ്ങനെ പ്രവർത്തിക്കുന്നു",
    supportWithoutConfusion: "ആശയക്കുഴപ്പമില്ലാതെ സഹായം",
    guidedExperience:
      "ആക്സസിബിലിറ്റി സഹായങ്ങൾ എളുപ്പത്തിൽ കണ്ടെത്താൻ സഹായിക്കുന്ന ലളിതമായ ഘട്ടംഘട്ടമായ അനുഭവം.",

    tellUsNeed: "നിങ്ങൾക്ക് എന്താണ് ആവശ്യമെന്ന് പറയൂ",
    tellUsNeedDescription:
      "കേൾവി, കാഴ്ച, ചലനം അല്ലെങ്കിൽ ആശയവിനിമയം തിരഞ്ഞെടുക്കുക.",

    chooseSupport: "നിങ്ങളുടെ സഹായം തിരഞ്ഞെടുക്കുക",
    chooseSupportDescription:
      "സഹായ ഉപകരണം, സർക്കാർ സഹായം, സേവന ദാതാവ് അല്ലെങ്കിൽ റിപ്പയർ സേവനം തിരഞ്ഞെടുക്കുക.",

    getResults: "പ്രസക്തമായ ഫലങ്ങൾ നേടുക",
    getResultsDescription:
      "നിങ്ങളുടെ ഉത്തരങ്ങൾ ഉപയോഗിച്ച് അനുയോജ്യമായ സഹായ വിവരങ്ങൾ കണ്ടെത്തുക.",

    assistiveDevices: "സഹായ ഉപകരണങ്ങൾ",
    assistiveDevicesDescription:
      "ദൈനംദിന ജീവിതത്തിൽ സഹായിക്കുന്ന ഉപകരണങ്ങൾ കണ്ടെത്തുക.",

    governmentSupport: "സർക്കാർ സഹായം",
    governmentSupportDescription:
      "സർക്കാർ സഹായങ്ങൾ എളുപ്പത്തിൽ കണ്ടെത്തുക.",

    serviceProviders: "സേവന ദാതാക്കൾ",
    serviceProvidersDescription:
      "പ്രസക്തമായ സഹായ സേവനങ്ങൾ നൽകുന്ന സ്ഥാപനങ്ങളുമായി ബന്ധപ്പെടുക.",

    repairs: "റിപ്പയർ സേവനങ്ങൾ",
    repairsDescription:
      "റിപ്പയറിനും പരിപാലനത്തിനുമുള്ള സഹായം കണ്ടെത്തുക.",

    footerTagline: "എളുപ്പത്തിൽ ലഭ്യമാകുന്ന സഹായം · മലയാളം + ഇംഗ്ലീഷ്",
  },
};

/* Keywords used to decide whether a resource's difficulty list matches
 * the difficulty the user picked. Keys are the exact UI labels. */
const difficultyKeywords: Record<string, string[]> = {
  "Hearing conversations": ["hearing", "communication", "conversation"],
  "Hearing alerts": ["hearing", "alert"],
  "Following group conversations": ["hearing", "communication", "group"],
  "Listening to media": ["hearing", "listening", "media"],

  Reading: ["reading", "read", "text"],
  "Seeing objects": ["seeing", "objects", "visual"],
  "Moving around safely": ["moving", "safely", "mobility"],
  "Recognizing people": ["recognizing", "people", "face"],

  Walking: ["walking", "walk", "mobility", "moving"],
  Standing: ["standing", "walking", "moving"],
  "Moving outdoors": ["moving", "outdoors", "mobility", "walking"],
  "Moving indoors": ["moving", "indoors", "mobility"],

  Speaking: ["speaking", "speech", "communication"],
  "Expressing needs": ["speaking", "expressing", "communication"],
  "Communicating with others": ["communication", "communicating", "speech"],
  "Using a communication device": ["communication", "device"],
};

function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = ((latitude2 - latitude1) * Math.PI) / 180;
  const longitudeDifference = ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos((latitude1 * Math.PI) / 180) *
      Math.cos((latitude2 * Math.PI) / 180) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

/* Turns any Supabase / network error into plain strings so that the
 * console never shows an unhelpful "{}". */
function describeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const e = error as Record<string, unknown>;

  return {
    name: String(e.name ?? ""),
    message: String(e.message ?? ""),
    details: String(e.details ?? ""),
    hint: String(e.hint ?? ""),
    code: String(e.code ?? ""),
  };
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [need, setNeed] = useState<Need | "">("");
  const [difficulty, setDifficulty] = useState("");
  const [supportType, setSupportType] =
    useState<SupportType | "">("");
  const [language, setLanguage] = useState<Language>("en");
  const [searched, setSearched] = useState(false);

  const [resources, setResources] =
    useState<SupportResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [showRequests, setShowRequests] = useState(false);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<SupportResource | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResult, setSmartResult] = useState<any>(null);
  const [trackingId, setTrackingId] = useState("");
  const [trackedRequest, setTrackedRequest] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackMessage, setTrackMessage] = useState("");
  const [smartQuery, setSmartQuery] = useState("");
  const [smartMatchMessage, setSmartMatchMessage] = useState("");

  const [listening, setListening] = useState(false);
  // The recognition object MUST be kept in a ref. If it is only a local
  // variable, Chrome can garbage-collect it mid-listening and the
  // onresult callback never fires (text never appears).
  const recognitionRef = useRef<any>(null);

  /* Keep <html lang> in sync with the selected language (screen readers). */
  useEffect(() => {
    document.documentElement.lang = language === "ml" ? "ml" : "en";
  }, [language]);

  /* Stop the microphone if the page is closed while listening. */
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  /* A new resource must never show the previous resource's request result. */
  useEffect(() => {
    setRequestSuccess(false);
    setRequestId(null);
    setRequestMessage("");
  }, [selectedResource?.id]);

  useEffect(() => {
    async function loadResources() {
      setResourcesLoading(true);

      const { data, error } = await supabase
        .from("support_resources")
        .select("*")
        .eq("verified", true)
        .eq("is_demo", false);

      if (error) {
        console.error(
          "Failed to load verified support resources:",
          JSON.stringify(describeError(error))
        );

        setResources([]);
        setResourcesLoading(false);
        return;
      }

      const mappedResources: SupportResource[] = (data ?? []).map(
        (item) => {
          const requiredDocuments: string[] = Array.isArray(
            item.required_documents
          )
            ? item.required_documents
            : [];

          const mlRequiredDocuments: string[] =
            Array.isArray(item.ml_required_documents) &&
            item.ml_required_documents.length > 0
              ? item.ml_required_documents
              : requiredDocuments;

          return {
            id: item.id,
            title: item.title ?? "",
            // Fall back to English when a Malayalam translation is missing.
            mlTitle: item.ml_title || item.title || "",
            description: item.description ?? "",
            mlDescription:
              item.ml_description || item.description || "",
            need: item.need,
            difficulty: Array.isArray(item.difficulty)
              ? item.difficulty
              : [],
            supportType: item.support_type,
            category: item.category ?? "",
            isDemo: item.is_demo,
            verified: item.verified,
            sourceUrl: item.source_url,
            contactPhone: item.contact_phone,
            contactEmail: item.contact_email,
            location: item.location,
            eligibility: item.eligibility,
            applicationInfo: item.application_info,
            verificationSource: item.verification_source,
            verifiedAt: item.verified_at,
            mlEligibility: item.ml_eligibility,
            mlApplicationInfo: item.ml_application_info,
            mlLocation: item.ml_location,
            mlVerificationSource: item.ml_verification_source,
            latitude: item.latitude,
            longitude: item.longitude,
            locationType: item.location_type,
            requiredDocuments,
            mlRequiredDocuments,
          };
        }
      );

      setResources(mappedResources);
      setResourcesLoading(false);
    }

    loadResources();
  }, []);

  async function loadSupportRequests() {
    setRequestsLoading(true);

    const { data, error } = await supabase
      .from("support_requests")
      .select(`
        id,
        resource_id,
        requester_name,
        requester_email,
        requester_phone,
        message,
        status,
        created_at,
        updated_at,
        support_resources (
          title,
          ml_title,
          location,
          support_type
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Failed to load support requests:",
        JSON.stringify(describeError(error))
      );
      setSupportRequests([]);
    } else {
      setSupportRequests(data ?? []);
    }

    setRequestsLoading(false);
  }

  async function trackSupportRequest() {
    const cleanedTrackingId = trackingId
      .replace(/^#\s*/, "")
      .trim();

    const id = Number(cleanedTrackingId);

    setTrackMessage("");
    setTrackedRequest(null);

    if (!Number.isInteger(id) || id <= 0) {
      setTrackMessage(
        language === "en"
          ? "Please enter a valid request ID number."
          : "ശരിയായ അഭ്യർത്ഥന നമ്പർ നൽകുക."
      );
      return;
    }

    setTrackingLoading(true);

    try {
      const { data, error } = await supabase
        .from("support_requests")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          support_resources (
            title,
            ml_title
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(
          "Failed to track request:",
          JSON.stringify(describeError(error))
        );
        setTrackMessage(
          language === "en"
            ? "We could not check this request. Please try again."
            : "ഈ അഭ്യർത്ഥന പരിശോധിക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക."
        );
      } else if (!data) {
        setTrackMessage(
          language === "en"
            ? "No request was found with this ID."
            : "ഈ നമ്പറിൽ അഭ്യർത്ഥന കണ്ടെത്തിയില്ല."
        );
      } else {
        setTrackedRequest(data);
      }
    } catch (err) {
      console.error(
        "Failed to track request:",
        JSON.stringify(describeError(err))
      );
      setTrackMessage(
        language === "en"
          ? "We could not check this request. Please try again."
          : "ഈ അഭ്യർത്ഥന പരിശോധിക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക."
      );
    } finally {
      setTrackingLoading(false);
    }
  }

  async function updateRequestStatus(
    requestId: number,
    status:
      | "submitted"
      | "accepted"
      | "in_progress"
      | "completed"
      | "cancelled"
  ) {
    const { error } = await supabase
      .from("support_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error(
        "Failed to update request:",
        JSON.stringify(describeError(error))
      );
      return;
    }

    await loadSupportRequests();
  }

  const t = text[language];

  const selectedNeed = needs.find(
    (item) => item.id === need
  );

  const selectedSupport = supportOptions.find(
    (item) => item.id === supportType
  );

  const selectedDifficulties = need
    ? difficulties[need]
    : [];

  const progress = (step / 4) * 100;

  const displayedDifficulty =
    language === "ml"
      ? difficultyMalayalam[difficulty] || difficulty
      : difficulty;

  function resourceMatchesDifficulty(resource: SupportResource) {
    if (!difficulty) return false;

    const label = difficulty.toLowerCase();
    const keywords = difficultyKeywords[difficulty] ?? [label];

    return (resource.difficulty ?? []).some((item) => {
      const normalizedItem = String(item).toLowerCase();

      return (
        normalizedItem === label ||
        keywords.some((keyword) => normalizedItem.includes(keyword))
      );
    });
  }

  function buildMatchReason(resource: SupportResource) {
    if (!selectedNeed) return "";

    const difficultyMatched = resourceMatchesDifficulty(resource);

    if (language === "en") {
      const parts = [`your ${selectedNeed.title} need`];

      if (difficultyMatched && displayedDifficulty) {
        parts.push(`${displayedDifficulty.toLowerCase()} difficulty`);
      }

      if (selectedSupport) {
        parts.push(
          `your ${selectedSupport.title.toLowerCase()} preference`
        );
      }

      const joined =
        parts.length > 1
          ? `${parts.slice(0, -1).join(", ")}, and ${
              parts[parts.length - 1]
            }`
          : parts[0];

      return `This resource matches ${joined}.`;
    }

    const parts = [`${selectedNeed.mlTitle} ആവശ്യത്തിനും`];

    if (difficultyMatched && displayedDifficulty) {
      parts.push(`${displayedDifficulty} ബുദ്ധിമുട്ടിനും`);
    }

    if (selectedSupport) {
      parts.push(`${selectedSupport.mlTitle} തിരഞ്ഞെടുപ്പിനും`);
    }

    return `നിങ്ങളുടെ ${parts.join(" ")} ഈ ഉറവിടം അനുയോജ്യമാണ്.`;
  }

  const matchingResources = resources
    .filter((resource) => {
      if (!need) return false;

      // Only show real, verified resources in production results.
      if (!resource.verified) return false;
      if (resource.isDemo) return false;

      // Match the detected need and support type.
      if (resource.need !== need) return false;

      if (supportType && resource.supportType !== supportType) {
        return false;
      }

      return true;
    })
    .map((resource) => {
      let score = 0;

      // Exact need match.
      if (resource.need === need) {
        score += 20;
      }

      // Exact support type match.
      if (supportType && resource.supportType === supportType) {
        score += 20;
      }

      // Difficulty match.
      if (resourceMatchesDifficulty(resource)) {
        score += 10;
      }

      // Verified resources receive additional confidence.
      if (resource.verified) {
        score += 10;
      }

      // Prefer resources with useful contact/application information.
      if (resource.sourceUrl) {
        score += 5;
      }

      if (resource.contactPhone) {
        score += 5;
      }

      if (resource.contactEmail) {
        score += 5;
      }

      if (resource.applicationInfo) {
        score += 5;
      }

      if (resource.eligibility) {
        score += 5;
      }

      let distanceKm: number | null = null;

      if (
        resource.locationType === "physical" &&
        userLocation &&
        resource.latitude !== null &&
        resource.longitude !== null
      ) {
        distanceKm = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          resource.latitude,
          resource.longitude
        );
      }

      return {
        ...resource,
        _score: score,
        _distanceKm: distanceKm,
      };
    })
    .sort((a, b) => {
      if (a._distanceKm !== null && b._distanceKm !== null) {
        return a._distanceKm - b._distanceKm;
      }

      if (a._distanceKm !== null) {
        return -1;
      }

      if (b._distanceKm !== null) {
        return 1;
      }

      return b._score - a._score;
    });

  const selectedResourceSupport = selectedResource
    ? supportOptions.find(
        (item) => item.id === selectedResource.supportType
      )
    : undefined;

  /* ------------------------------------------------------------------ */
  /* Voice input                                                         */
  /* ------------------------------------------------------------------ */

  function voiceMessage(kind: string) {
    const en: Record<string, string> = {
      unsupported:
        "Voice input is not supported in this browser. Please use Chrome or Edge, or type your request.",
      insecure:
        "Voice input needs a secure page (https or localhost). Please type your request.",
      listening:
        "Listening… please speak now. Tap the button again to stop.",
      "not-allowed":
        "Microphone access is blocked. Allow microphone permission in your browser settings and try again.",
      "service-not-allowed":
        "Microphone access is blocked. Allow microphone permission in your browser settings and try again.",
      "no-speech":
        "We did not hear anything. Tap Speak and try again.",
      "audio-capture":
        "No microphone was found. Please check your microphone.",
      network:
        "Voice input needs an internet connection. Please check your connection or type your request.",
      "language-not-supported":
        "Voice input is not available for this language in your browser. Please type your request.",
      nothing:
        "We could not hear anything clearly. Please try again.",
      default:
        "Voice input could not be captured. Please try again.",
    };

    const ml: Record<string, string> = {
      unsupported:
        "ഈ ബ്രൗസറിൽ വോയ്സ് ഇൻപുട്ട് ലഭ്യമല്ല. Chrome അല്ലെങ്കിൽ Edge ഉപയോഗിക്കുക, അല്ലെങ്കിൽ ടെക്സ്റ്റ് ടൈപ്പ് ചെയ്യുക.",
      insecure:
        "വോയ്സ് ഇൻപുട്ടിന് സുരക്ഷിതമായ പേജ് (https അല്ലെങ്കിൽ localhost) ആവശ്യമാണ്. ദയവായി ടൈപ്പ് ചെയ്യുക.",
      listening:
        "കേൾക്കുന്നു… ദയവായി സംസാരിക്കൂ. നിർത്താൻ ബട്ടൺ വീണ്ടും അമർത്തുക.",
      "not-allowed":
        "മൈക്രോഫോൺ ആക്സസ് തടഞ്ഞിരിക്കുന്നു. ബ്രൗസർ സെറ്റിങ്സിൽ മൈക്രോഫോൺ അനുവദിച്ച് വീണ്ടും ശ്രമിക്കുക.",
      "service-not-allowed":
        "മൈക്രോഫോൺ ആക്സസ് തടഞ്ഞിരിക്കുന്നു. ബ്രൗസർ സെറ്റിങ്സിൽ മൈക്രോഫോൺ അനുവദിച്ച് വീണ്ടും ശ്രമിക്കുക.",
      "no-speech":
        "ഒന്നും കേൾക്കാനായില്ല. ‘പറയുക’ അമർത്തി വീണ്ടും ശ്രമിക്കുക.",
      "audio-capture":
        "മൈക്രോഫോൺ കണ്ടെത്തിയില്ല. നിങ്ങളുടെ മൈക്രോഫോൺ പരിശോധിക്കുക.",
      network:
        "വോയ്സ് ഇൻപുട്ടിന് ഇന്റർനെറ്റ് ആവശ്യമാണ്. കണക്ഷൻ പരിശോധിക്കുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക.",
      "language-not-supported":
        "നിങ്ങളുടെ ബ്രൗസറിൽ ഈ ഭാഷയ്ക്ക് വോയ്സ് ഇൻപുട്ട് ലഭ്യമല്ല. ദയവായി ടൈപ്പ് ചെയ്യുക.",
      nothing:
        "വ്യക്തമായി കേൾക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.",
      default:
        "വോയ്സ് ഇൻപുട്ട് ലഭിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.",
    };

    const table = language === "ml" ? ml : en;

    return table[kind] ?? table.default;
  }

  function toggleVoiceInput() {
    // Second tap = stop listening.
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSmartMatchMessage(voiceMessage("unsupported"));
      return;
    }

    if (!window.isSecureContext) {
      setSmartMatchMessage(voiceMessage("insecure"));
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = language === "ml" ? "ml-IN" : "en-IN";
    // Interim results let the text appear while the person is speaking.
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    const baseText = smartQuery.trim() ? `${smartQuery.trim()} ` : "";
    let finalTranscript = "";
    let heardSomething = false;
    let hadError = false;

    recognition.onstart = () => {
      setListening(true);
      setSmartMatchMessage(voiceMessage("listening"));
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const combined = `${baseText}${finalTranscript}${interimTranscript}`;

      if (combined.trim()) {
        heardSomething = true;
        setSmartQuery(combined);
        setSmartMatchMessage("");
      }
    };

    recognition.onerror = (event: any) => {
      // "aborted" happens when we stop it ourselves - not a real error.
      if (event?.error === "aborted") return;

      hadError = true;
      console.error("Speech recognition error:", event?.error);
      setSmartMatchMessage(voiceMessage(event?.error ?? "default"));
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;

      if (!hadError && !heardSomething) {
        setSmartMatchMessage(voiceMessage("nothing"));
      } else if (!hadError) {
        setSmartMatchMessage("");
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Could not start speech recognition:", err);
      setListening(false);
      recognitionRef.current = null;
      setSmartMatchMessage(voiceMessage("default"));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Smart Match                                                         */
  /* ------------------------------------------------------------------ */

  async function runSmartMatch() {
    const query = smartQuery.trim();

    // Stop the microphone if it is still listening.
    recognitionRef.current?.stop();

    if (!query) {
      setSmartMatchMessage(
        language === "ml"
          ? "ദയവായി നിങ്ങൾക്ക് ആവശ്യമായ സഹായം വിവരിക്കുക."
          : "Please describe what kind of help you need."
      );
      return;
    }

    setSmartLoading(true);
    setSmartMatchMessage("");

    try {
      let result: any;

      try {
        const response = await fetch("/api/smart-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error("Smart Match request failed");
        }

        result = await response.json();
      } catch {
        /*
         * Client-side fallback so Smart Match does not become
         * unusable if the API route is temporarily unavailable.
         * It uses the same classifier as the server (and understands
         * Malayalam keywords too).
         */
        result = {
          ...classifyQuery(query),
          source: "client-fallback",
        };
      }

      const detectedNeed: Need | "" = allowedNeeds.includes(result?.need)
        ? result.need
        : "";

      if (!detectedNeed) {
        setSmartMatchMessage(
          language === "en"
            ? "Please describe what accessibility difficulty you are experiencing."
            : "നിങ്ങൾ നേരിടുന്ന പ്രവേശനക്ഷമതാ ബുദ്ധിമുട്ട് കുറച്ച് കൂടുതൽ വിശദമായി വിവരിക്കുക."
        );

        return;
      }

      const detectedSupportType: SupportType | "" = supportOptions.some(
        (option) => option.id === result?.supportType
      )
        ? result.supportType
        : "";

      /*
       * Keep the wizard's difficulty empty when the request cannot
       * be confidently mapped to one of the existing UI difficulty
       * choices. Matching still uses need, support type and the
       * verified status of each resource.
       */
      const detectedDifficulty =
        Array.isArray(result?.difficulty) && result.difficulty.length > 0
          ? result.difficulty[0]
          : "";

      const validDifficulty = difficulties[detectedNeed]?.includes(
        detectedDifficulty
      )
        ? detectedDifficulty
        : "";

      setNeed(detectedNeed);
      setDifficulty(validDifficulty);
      setSupportType(detectedSupportType);

      setSearched(true);
      setSelectedResource(null);
      setSmartResult(result);
      setStep(4);

      setSmartMatchMessage(
        language === "ml"
          ? "നിങ്ങളുടെ ആവശ്യത്തിന് അനുയോജ്യമായ സഹായ വിഭാഗം കണ്ടെത്തി."
          : "We found the support category that best matches your request."
      );
    } finally {
      setSmartLoading(false);
    }
  }

  function requestUserLocation() {
    if (!navigator.geolocation) {
      setLocationError(
        language === "en"
          ? "Location is not supported by this browser."
          : "ഈ ബ്രൗസറിൽ ലൊക്കേഷൻ പിന്തുണയ്ക്കുന്നില്ല."
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationLoading(false);
      },
      (error) => {
        console.error("Location permission/error:", error.code, error.message);

        setLocationLoading(false);

        setLocationError(
          language === "en"
            ? "Location access was not allowed. You can still view verified support resources."
            : "ലൊക്കേഷൻ ആക്‌സസ് അനുവദിച്ചില്ല. നിങ്ങൾക്ക് ഇപ്പോഴും പരിശോധിച്ച പിന്തുണാ വിഭവങ്ങൾ കാണാം."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  async function submitSupportRequest() {
    if (!selectedResource || requestSubmitting || requestSuccess) return;

    setRequestSubmitting(true);
    setRequestMessage("");
    setRequestSuccess(false);

    const failureMessage =
      language === "en"
        ? "We could not submit your request. Please try again."
        : "നിങ്ങളുടെ അഭ്യർത്ഥന സമർപ്പിക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.";

    try {
      const { data, error, status, statusText } = await supabase
        .from("support_requests")
        .insert({
          resource_id: selectedResource.id,

          need: selectedResource.need,

          support_type: selectedResource.supportType,

          description:
            language === "en"
              ? selectedResource.description
              : selectedResource.mlDescription,

          preferred_language: language,

          message:
            language === "en"
              ? "User requested help with this support resource."
              : "ഈ പിന്തുണാ വിഭവത്തിനായി ഉപയോക്താവ് സഹായം അഭ്യർത്ഥിച്ചു.",

          status: "submitted",
        })
        .select("id")
        .single();

      if (error || !data) {
        // JSON.stringify makes sure the real reason is visible in the
        // console (the previous version printed an empty object).
        console.error(
          "Failed to submit support request:",
          JSON.stringify({
            ...describeError(error),
            httpStatus: status,
            httpStatusText: statusText,
          })
        );

        setRequestMessage(failureMessage);
        return;
      }

      setRequestId(data.id);
      setRequestSuccess(true);
    } catch (err) {
      console.error(
        "Failed to submit support request:",
        JSON.stringify(describeError(err))
      );

      setRequestMessage(failureMessage);
    } finally {
      setRequestSubmitting(false);
    }
  }

  function selectNeed(value: Need) {
    setNeed(value);
    setDifficulty("");
    setSupportType("");
    setSearched(false);
    setSelectedResource(null);
    setSmartResult(null);
    setSmartMatchMessage("");
    setStep(2);
  }

  function selectDifficulty(value: string) {
    setDifficulty(value);
    setSupportType("");
    setSearched(false);
    setSelectedResource(null);
    setStep(3);
  }

  function selectSupport(value: SupportType) {
    setSupportType(value);
    setSearched(false);
    setSelectedResource(null);
    setStep(4);
  }

  function goBack() {
    setSelectedResource(null);
    setSearched(false);

    if (step === 2) {
      setStep(1);
      setDifficulty("");
    } else if (step === 3) {
      setStep(2);
      setSupportType("");
    } else if (step === 4) {
      setStep(3);
    }
  }

  function resetWizard() {
    recognitionRef.current?.abort?.();

    setStep(1);
    setNeed("");
    setDifficulty("");
    setSupportType("");
    setSearched(false);
    setSelectedResource(null);

    setSmartQuery("");
    setSmartResult(null);
    setSmartMatchMessage("");
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-[#202b62] focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        Skip to main content
      </a>

      <main
        id="main-content"
        className="min-h-screen overflow-x-hidden bg-[#f7f8fc] text-[#172033]"
      >
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes appear {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slide {
          from {
            opacity: 0;
            transform: translateX(25px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          from {
            transform: translateX(-120%);
          }

          to {
            transform: translateX(120%);
          }
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }

        .animate-appear {
          animation: appear 0.45s ease-out both;
        }

        .animate-slide {
          animation: slide 0.4s ease-out both;
        }
      `}</style>

      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#f7f8fc]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group flex items-center gap-3"
          >
            <div className="relative grid size-11 place-items-center rounded-2xl bg-[#202b62] text-lg font-black text-white shadow-lg transition duration-300 group-hover:rotate-[-3deg] group-hover:scale-105">
              A<span className="text-[#ff806b]">+</span>
            </div>

            <div className="text-left">
              <div className="text-[15px] font-black tracking-[.16em] text-[#202b62]">
                ACCESS+
              </div>

              <div className="text-[11px] text-slate-500">
                {t.brandTagline}
              </div>
            </div>
          </button>

          <div
            className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm"
            role="group"
            aria-label="Language"
          >
            <button
              onClick={() => setLanguage("ml")}
              aria-pressed={language === "ml"}
              lang="ml"
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                language === "ml"
                  ? "bg-[#202b62] text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              മലയാളം
            </button>

            <button
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              lang="en"
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                language === "en"
                  ? "bg-[#202b62] text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute -left-40 top-0 size-[420px] rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 size-[380px] rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
          <div className="animate-appear">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-800">
              <span className="size-2 animate-pulse rounded-full bg-cyan-500" />
              {t.badge}
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.03] tracking-[-.055em] text-[#202b62] sm:text-6xl lg:text-7xl">
              {language === "en" ? (
                <>
                  Find the{" "}
                  <span className="text-[#ff806b]">
                    support
                  </span>{" "}
                  you need.
                </>
              ) : (
                t.heroTitle
              )}
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              {t.heroText}
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("support-wizard")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="group relative mt-9 overflow-hidden rounded-2xl bg-[#ff806b] px-7 py-4 text-sm font-black text-white shadow-[0_16px_35px_rgba(255,128,107,.3)] transition duration-300 hover:-translate-y-1 hover:bg-[#f26f5b]"
            >
              <span className="relative z-10">
                {t.start}
                <span className="ml-3 transition group-hover:ml-4" aria-hidden="true">
                  →
                </span>
              </span>

              <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-[150%] skew-x-[-20deg] bg-white/20 group-hover:animate-[shimmer_1s_ease-out]" />
            </button>

            <div className="mt-8 flex flex-wrap gap-6 text-xs font-semibold text-slate-500">
              <span>✓ {t.simpleStep}</span>
              <span>✓ {t.malayalamSupport}</span>
              <span>✓ {t.accessibilityFocused}</span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative hidden h-[390px] lg:block" aria-hidden="true">
            <div className="animate-float absolute right-5 top-5 w-72 rounded-[32px] border border-white bg-white/80 p-6 shadow-[0_30px_80px_rgba(32,43,98,.13)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xl text-white">
                  ♿
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600">
                  ACCESS+
                </span>
              </div>

              <h3 className="mt-6 font-black text-[#202b62]">
                {t.heroVisualTitle}
              </h3>

              <div className="mt-5 space-y-3">
                {needs.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div
                      className={`grid size-8 place-items-center rounded-lg bg-gradient-to-br ${item.tone} text-xs text-white`}
                    >
                      {item.icon}
                    </div>

                    <span className="text-xs font-bold text-slate-600">
                      {language === "ml"
                        ? item.mlTitle
                        : item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-float absolute bottom-0 left-4 rounded-3xl bg-[#202b62] p-5 text-white shadow-2xl [animation-delay:1s]">
              <div className="text-xs font-bold text-white/50">
                {t.personalized}
              </div>

              <div className="mt-1 text-sm font-black">
                {t.supportMadeSimple} ✦
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINDER */}
      <section
        id="support-wizard"
        className="mx-auto max-w-5xl scroll-mt-24 px-5 pb-28 lg:px-8"
      >
        <div className="mb-10 text-center">
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#ff806b]">
            {t.finder}
          </p>

          <h2 className="mt-3 text-3xl font-black text-[#202b62] sm:text-4xl">
            {t.finderTitle}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            {t.finderText}
          </p>
        </div>
      {/* SMART MATCH */}
        <section className="mb-8 rounded-[28px] border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <p className="text-sm font-black text-indigo-600">
              ✨ Smart Match
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#202b62]">
              {language === "en"
                ? "Tell us what you need"
                : "നിങ്ങൾക്ക് എന്താണ് ആവശ്യമെന്ന് പറയൂ"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {language === "en"
                ? "Describe your situation in your own words and we will find the relevant type of support."
                : "നിങ്ങളുടെ ആവശ്യത്തെക്കുറിച്ച് സ്വന്തം വാക്കുകളിൽ വിവരിക്കൂ. അനുയോജ്യമായ സഹായ വിഭാഗം കണ്ടെത്താൻ ഞങ്ങൾ ശ്രമിക്കും."}
            </p>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={smartLoading}
              aria-pressed={listening}
              className={`inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 ${
                listening ? "animate-pulse" : ""
              }`}
              aria-label={
                listening
                  ? language === "en"
                    ? "Stop listening"
                    : "കേൾക്കുന്നത് നിർത്തുക"
                  : language === "en"
                    ? "Speak your support request"
                    : "നിങ്ങളുടെ സഹായ ആവശ്യം പറയുക"
              }
            >
              <span aria-hidden="true">🎙️</span>
              {listening
                ? language === "en"
                  ? "Listening… tap to stop"
                  : "കേൾക്കുന്നു… നിർത്താൻ അമർത്തുക"
                : language === "en"
                  ? "Speak"
                  : "പറയുക"}
            </button>

            {smartQuery && (
              <button
                type="button"
                onClick={() => {
                  recognitionRef.current?.abort?.();
                  setSmartQuery("");
                  setSmartMatchMessage("");
                  setSmartResult(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-500 transition hover:bg-slate-50"
              >
                {language === "en"
                  ? "Clear"
                  : "മായ്ക്കുക"}
              </button>
            )}
          </div>
          <textarea
            value={smartQuery}
            onChange={(event) => {
              setSmartQuery(event.target.value);
              setSmartMatchMessage("");
            }}
            placeholder={
              language === "en"
                ? "Example: I need help getting a wheelchair"
                : "ഉദാഹരണം: എനിക്ക് ഒരു വീൽചെയർ ലഭിക്കാൻ സഹായം വേണം"
            }
            rows={3}
            className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            aria-label={
              language === "en"
                ? "Describe what support you need"
                : "നിങ്ങൾക്ക് ആവശ്യമായ സഹായം വിവരിക്കുക"
            }
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runSmartMatch}
              disabled={smartLoading || !smartQuery.trim()}
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#202b62] px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#2b397c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {smartLoading ? (
                <>
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {language === "en"
                    ? "Finding support..."
                    : "സഹായം കണ്ടെത്തുന്നു..."}
                </>
              ) : (
                <>
                  ✨{" "}
                  {language === "en"
                    ? "Find Support"
                    : "സഹായം കണ്ടെത്തുക"}
                </>
              )}
            </button>

            <span className="text-xs text-slate-400">
              {language === "en"
                ? 'Example: "My hearing aid is broken and needs repair"'
                : '"എന്റെ ഹിയറിംഗ് എയ്ഡ് കേടായി, റിപ്പയർ ചെയ്യണം"'}
            </span>
          </div>

          {smartMatchMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-2xl bg-indigo-50 p-4 text-sm font-semibold text-indigo-800"
            >
              {smartMatchMessage}
            </div>
          )}
          {smartResult?.explanation && (
            <div
              className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4"
              role="status"
              aria-live="polite"
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                {language === "en"
                  ? "Smart Match explanation"
                  : "സ്മാർട്ട് മാച്ച് വിശദീകരണം"}
              </p>

              <p className="mt-2 text-sm font-bold leading-6 text-[#202b62]">
                {smartResult.explanation}
              </p>
            </div>
          )}
        </section>
        {/* PROGRESS */}
        <div className="mb-8">
          <div className="mb-3 flex justify-between">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    item <= step
                      ? "w-8 bg-[#ff806b]"
                      : "w-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <span className="font-mono text-xs font-bold text-[#202b62]">
              {String(step).padStart(2, "0")} / 04
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={step}
            aria-label={
              language === "en"
                ? `Step ${step} of 4`
                : `ഘട്ടം ${step} / 4`
            }
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff806b] to-orange-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-appear">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400">
                  {t.step01}
                </span>

                <h3 className="mt-1 text-2xl font-black text-[#202b62]">
                  {t.question1}
                </h3>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {needs.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => selectNeed(item.id)}
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                  className="group animate-appear relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-2 hover:border-cyan-300 hover:shadow-[0_25px_50px_rgba(32,43,98,.12)]"
                >
                  <div className="absolute -right-16 -top-16 size-40 rounded-full bg-cyan-100 opacity-0 blur-3xl transition group-hover:opacity-100" />

                  <div className="relative flex items-start justify-between">
                    <div
                      aria-hidden="true"
                      className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${item.tone} text-2xl font-bold text-white shadow-lg transition duration-300 group-hover:rotate-3 group-hover:scale-110`}
                    >
                      {item.icon}
                    </div>

                    <span
                      aria-hidden="true"
                      className="grid size-9 place-items-center rounded-full bg-slate-50 text-lg text-slate-300 transition group-hover:bg-[#ff806b] group-hover:text-white"
                    >
                      →
                    </span>
                  </div>

                  <h4 className="relative mt-7 text-xl font-black text-[#202b62]">
                    {language === "ml"
                      ? item.mlTitle
                      : item.title}
                  </h4>

                  <p className="relative mt-2 text-sm leading-6 text-slate-500">
                    {language === "ml"
                      ? item.mlDescription
                      : item.description}
                  </p>

                  <div className="mt-5 text-[11px] font-black uppercase tracking-wider text-slate-300 transition group-hover:text-[#ff806b]">
                    {language === "en" ? "Continue" : "തുടരുക"} →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && selectedNeed && (
          <div className="animate-slide rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(32,43,98,.08)]">
            <div className="border-b border-slate-100 p-7 sm:p-10">
              <button
                onClick={goBack}
                className="mb-8 text-sm font-bold text-slate-400 hover:text-[#ff806b]"
              >
                ← {t.back}
              </button>

              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${selectedNeed.tone} text-2xl text-white shadow-lg`}
                >
                  {selectedNeed.icon}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#ff806b]">
                    {t.step02}
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-[#202b62]">
                    {t.question2}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-slate-500">
                {t.question2Text}
              </p>
            </div>

            <div className="grid gap-3 p-7 sm:grid-cols-2 sm:p-10">
              {selectedDifficulties.map((option, index) => (
                <button
                  key={option}
                  onClick={() => selectDifficulty(option)}
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                  className="group animate-appear flex min-h-[75px] items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-left transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-lg"
                >
                  <span className="font-bold text-slate-700">
                    {language === "ml"
                      ? difficultyMalayalam[option]
                      : option}
                  </span>

                  <span
                    aria-hidden="true"
                    className="grid size-9 place-items-center rounded-full bg-white text-slate-300 shadow-sm transition group-hover:bg-[#ff806b] group-hover:text-white"
                  >
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animate-slide rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(32,43,98,.08)] sm:p-10">
            <button
              onClick={goBack}
              className="mb-8 text-sm font-bold text-slate-400 hover:text-[#ff806b]"
            >
              ← {t.back}
            </button>

            <p className="text-xs font-black uppercase tracking-widest text-[#ff806b]">
              {t.step03}
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#202b62]">
              {t.question3}
            </h3>

            <p className="mt-2 text-slate-500">
              {t.question3Text}
            </p>

            <div className="mt-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
              {displayedDifficulty}
            </div>

            <div className="mt-8 grid gap-3">
              {supportOptions.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => selectSupport(option.id)}
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                  className="group animate-appear flex gap-4 rounded-2xl border border-slate-200 p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-lg"
                >
                  <div
                    aria-hidden="true"
                    className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-2xl text-[#202b62] group-hover:bg-white"
                  >
                    {option.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-black text-[#202b62]">
                        {language === "ml"
                          ? option.mlTitle
                          : option.title}
                      </h4>

                      <span
                        aria-hidden="true"
                        className="grid size-8 place-items-center rounded-full bg-white text-slate-300 shadow-sm group-hover:bg-[#ff806b] group-hover:text-white"
                      >
                        →
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {language === "ml"
                        ? option.mlDescription
                        : option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {/* selectedSupport may be empty (Smart Match without a support type),
            so it is no longer required to render this step. */}
        {step === 4 && selectedNeed && (
          <div className="animate-appear overflow-hidden rounded-[32px] bg-[#202b62] text-white shadow-[0_30px_80px_rgba(32,43,98,.25)]">
            <div className="relative overflow-hidden p-7 sm:p-10">
              <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black text-cyan-200">
                  <span className="size-2 animate-pulse rounded-full bg-cyan-300" />
                  {t.ready}
                </div>

                <h3 className="mt-5 text-3xl font-black sm:text-4xl">
                  {t.profile}
                </h3>

                <p className="mt-3 max-w-xl leading-7 text-white/60">
                  {t.readyText}
                </p>
              </div>

              {/* PROFILE */}
              <div className="relative mt-9 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/[.15]">
                  <div className="mb-4 text-2xl" aria-hidden="true">
                    {selectedNeed.icon}
                  </div>

                  <p className="text-xs text-white/40">
                    {language === "en" ? "Need" : "ആവശ്യം"}
                  </p>

                  <p className="mt-1 font-black">
                    {language === "ml"
                      ? selectedNeed.mlTitle
                      : selectedNeed.title}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/[.15]">
                  <div className="mb-4 text-2xl" aria-hidden="true">
                    ◌
                  </div>

                  <p className="text-xs text-white/40">
                    {language === "en" ? "Difficulty" : "ബുദ്ധിമുട്ട്"}
                  </p>

                  <p className="mt-1 font-black">
                    {displayedDifficulty ||
                      (language === "en"
                        ? "Not specified"
                        : "വ്യക്തമാക്കിയിട്ടില്ല")}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/[.15]">
                  <div className="mb-4 text-2xl" aria-hidden="true">
                    {selectedSupport?.icon ?? "✦"}
                  </div>

                  <p className="text-xs text-white/40">
                    {language === "en" ? "Support" : "പിന്തുണ"}
                  </p>

                  <p className="mt-1 font-black">
                    {selectedSupport
                      ? language === "ml"
                        ? selectedSupport.mlTitle
                        : selectedSupport.title
                      : language === "en"
                        ? "Not specified"
                        : "വ്യക്തമാക്കിയിട്ടില്ല"}
                  </p>
                </div>
              </div>

              {/* SEARCH STATUS */}
              <div className="relative mt-8 rounded-3xl border border-white/10 bg-white/[.06] p-6">
                <div className="flex gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ff806b] text-xl" aria-hidden="true">
                    ✨
                  </div>

                  <div>
                    <h4 className="font-black">
                      {searched
                        ? language === "en"
                          ? "Support search started"
                          : "സഹായ തിരയൽ ആരംഭിച്ചു"
                        : language === "en"
                          ? "Your profile is ready"
                          : "നിങ്ങളുടെ പ്രൊഫൈൽ തയ്യാറാണ്"}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-white/55">
                      {searched
                        ? language === "en"
                          ? "Your selected support category is ready to connect with relevant resources."
                          : "നിങ്ങൾ തിരഞ്ഞെടുത്ത സഹായ വിഭാഗം പ്രസക്തമായ ഉറവിടങ്ങളുമായി ബന്ധിപ്പിക്കാൻ തയ്യാറാണ്."
                        : language === "en"
                          ? "We have everything needed to begin your personalised support search."
                          : "നിങ്ങളുടെ വ്യക്തിഗത സഹായ തിരയൽ ആരംഭിക്കാൻ ആവശ്യമായ വിവരങ്ങൾ തയ്യാറാണ്."}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="relative mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setSearched(true);
                    setSelectedResource(null);
                  }}
                  className="group rounded-2xl bg-[#ff806b] px-6 py-3.5 text-sm font-black shadow-lg transition hover:-translate-y-1 hover:bg-[#f26f5b]"
                >
                  {t.find}

                  <span className="ml-3 transition group-hover:ml-4" aria-hidden="true">
                    →
                  </span>
                </button>

                <button
                  onClick={resetWizard}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold transition hover:bg-white/10"
                >
                  {t.again}
                </button>
              </div>

              {/* SEARCH RESULTS */}
              {searched && !resourcesLoading && (
                <div className="relative mt-8 animate-appear">
                  {selectedResource ? (
                    <div className="animate-appear">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedResource(null)
                        }
                        className="mb-5 text-sm font-bold text-white/50 transition hover:text-[#ff806b]"
                      >
                        ←{" "}
                        {language === "en"
                          ? "Back to support options"
                          : "പിന്തിരിച്ച് സഹായ ഓപ്ഷനുകളിലേക്ക്"}
                      </button>

                      <div className="mt-6 rounded-3xl border border-white/10 bg-white p-6 text-[#202b62] shadow-2xl sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {language === "ml"
                                ? categoryMalayalam[
                                    selectedResource.category
                                  ] ||
                                  selectedResource.category
                                : selectedResource.category}
                            </div>

                            <h4 className="text-2xl font-black sm:text-3xl">
                              {language === "ml"
                                ? selectedResource.mlTitle ||
                                  selectedResource.title
                                : selectedResource.title}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedResource(null)
                            }
                            className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                            aria-label={language === "en" ? "Close details" : "വിശദാംശങ്ങൾ അടയ്ക്കുക"}
                          >
                            <span aria-hidden="true" className="text-lg leading-none">
                              ×
                            </span>
                          </button>
                        </div>

                        <p className="mt-5 max-w-2xl leading-7 text-slate-500">
                          {language === "ml"
                            ? selectedResource.mlDescription ||
                              selectedResource.description
                            : selectedResource.description}
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {language === "en"
                                ? "Support type"
                                : "സഹായത്തിന്റെ തരം"}
                            </p>

                            <p className="mt-2 font-black text-[#202b62]">
                              {language === "en"
                                ? selectedResourceSupport?.title
                                : selectedResourceSupport?.mlTitle}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {language === "en"
                                ? "Your difficulty"
                                : "നിങ്ങളുടെ ബുദ്ധിമുട്ട്"}
                            </p>

                            <p className="mt-2 font-black text-[#202b62]">
                              {displayedDifficulty ||
                                (language === "en"
                                  ? "Not specified"
                                  : "വ്യക്തമാക്കിയിട്ടില്ല")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-lg" aria-hidden="true">
                              {selectedResource.verified
                                ? "✓"
                                : "○"}
                            </span>

                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                                {language === "en"
                                  ? selectedResource.verified
                                    ? "Verified resource"
                                    : selectedResource.isDemo
                                      ? "Demo resource"
                                      : "Resource information"
                                  : selectedResource.verified
                                    ? "പരിശോധിച്ച ഉറവിടം"
                                    : selectedResource.isDemo
                                      ? "ഡെമോ ഉറവിടം"
                                      : "ഉറവിട വിവരം"}
                              </p>

                              <p className="mt-1 text-xs font-bold leading-5 text-amber-700">
                                {language === "en"
                                  ? selectedResource.verified
                                    ? "This resource has been marked as verified."
                                    : "This resource currently uses sample information. Verified real-world information will be added later."
                                  : selectedResource.verified
                                    ? "ഈ ഉറവിടം പരിശോധിച്ചതായി അടയാളപ്പെടുത്തിയിരിക്കുന്നു."
                                    : "ഈ ഉറവിടത്തിൽ നിലവിൽ സാമ്പിൾ വിവരങ്ങളാണ് ഉപയോഗിക്കുന്നത്. പിന്നീട് പരിശോധിച്ച യഥാർത്ഥ വിവരങ്ങൾ ചേർക്കും."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {language === "en"
                              ? "What you can do next"
                              : "അടുത്തതായി നിങ്ങൾക്ക് ചെയ്യാവുന്നത്"}
                          </p>

                         <p className="mt-2 text-sm font-bold leading-6 text-[#202b62]">
                            {language === "en"
                              ? selectedResource.supportType ===
                                "assistive-device"
                                ? "Learn more about the device and check whether it matches your needs."
                                : selectedResource.supportType ===
                                    "government"
                                  ? "Check the relevant eligibility requirements and application process."
                                  : selectedResource.supportType ===
                                      "provider"
                                    ? "Look for a suitable organization or professional who can provide this support."
                                    : "Look for a suitable repair or maintenance service for the device."
                              : selectedResource.supportType ===
                                  "assistive-device"
                                ? "ഈ ഉപകരണത്തെക്കുറിച്ച് കൂടുതൽ മനസ്സിലാക്കി ഇത് നിങ്ങളുടെ ആവശ്യങ്ങൾക്ക് അനുയോജ്യമാണോ എന്ന് പരിശോധിക്കുക."
                                : selectedResource.supportType ===
                                    "government"
                                  ? "യോഗ്യതാ നിബന്ധനകളും അപേക്ഷാ നടപടിക്രമവും പരിശോധിക്കുക."
                                  : selectedResource.supportType ===
                                      "provider"
                                    ? "ഈ സഹായം നൽകാൻ കഴിയുന്ന അനുയോജ്യമായ സ്ഥാപനത്തെയോ പ്രൊഫഷണലിനെയോ കണ്ടെത്തുക."
                                    : "ഉപകരണത്തിനുള്ള അനുയോജ്യമായ റിപ്പയർ അല്ലെങ്കിൽ പരിപാലന സേവനം കണ്ടെത്തുക."}
                          </p>
                        </div>

                        <div className="mt-4 rounded-2xl bg-cyan-50 p-5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-700">
                            {language === "en"
                              ? "Why this matches"
                              : "എന്തുകൊണ്ടാണ് ഇത് അനുയോജ്യം"}
                          </p>

                          <p className="mt-2 text-sm font-bold leading-6 text-[#202b62]">
                            {buildMatchReason(selectedResource)}
                          </p>
                        </div>

                        {/* ELIGIBILITY */}
                        {(language === "ml"
                          ? selectedResource.mlEligibility ||
                            selectedResource.eligibility
                          : selectedResource.eligibility) && (
                          <div className="mt-4 rounded-2xl bg-emerald-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                              {language === "en"
                                ? "Eligibility"
                                : "യോഗ്യത"}
                            </p>

                            <p className="mt-2 text-sm font-bold leading-6 text-[#202b62]">
                              {language === "ml"
                                ? selectedResource.mlEligibility ||
                                  selectedResource.eligibility
                                : selectedResource.eligibility}
                            </p>
                          </div>
                        )}
                        {selectedResource.requiredDocuments.length > 0 && (
                          <div className="mt-6">
                            <h5 className="text-sm font-black uppercase tracking-[.14em] text-slate-400">
                              {language === "en"
                                ? "Required documents"
                                : "ആവശ്യമായ രേഖകൾ"}
                            </h5>

                            <ul className="mt-3 space-y-2">
                              {(language === "ml"
                                ? selectedResource.mlRequiredDocuments
                                : selectedResource.requiredDocuments
                              ).map((document, index) => (
                                <li
                                  key={`${selectedResource.id}-document-${index}`}
                                  className="flex gap-2 text-sm leading-6 text-slate-600"
                                >
                                  <span aria-hidden="true">•</span>
                                  <span>{document}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* APPLICATION INFORMATION */}
                        {(language === "ml"
                          ? selectedResource.mlApplicationInfo ||
                            selectedResource.applicationInfo
                          : selectedResource.applicationInfo) && (
                          <div className="mt-4 rounded-2xl bg-blue-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                              {language === "en"
                                ? "Application information"
                                : "അപേക്ഷാ വിവരം"}
                            </p>

                            <p className="mt-2 text-sm font-bold leading-6 text-[#202b62]">
                              {language === "ml"
                                ? selectedResource.mlApplicationInfo ||
                                  selectedResource.applicationInfo
                                : selectedResource.applicationInfo}
                            </p>
                          </div>
                        )}

                        {/* CONTACT & LOCATION */}
                        {(language === "ml"
                          ? selectedResource.mlLocation ||
                            selectedResource.location ||
                            selectedResource.contactPhone ||
                            selectedResource.contactEmail
                          : selectedResource.location ||
                            selectedResource.contactPhone ||
                            selectedResource.contactEmail) && (
                          <div className="mt-4 rounded-2xl bg-violet-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-violet-700">
                              {language === "en"
                                ? "Contact & location"
                                : "ബന്ധപ്പെടാനുള്ള വിവരങ്ങളും സ്ഥലവും"}
                            </p>

                            <div className="mt-3 space-y-2 text-sm font-bold leading-6 text-[#202b62]">
                              {(language === "ml"
                                ? selectedResource.mlLocation ||
                                  selectedResource.location
                                : selectedResource.location) && (
                                <p>
                                  <span className="text-violet-700">
                                    {language === "en"
                                      ? "Location: "
                                      : "സ്ഥലം: "}
                                  </span>

                                  {language === "ml"
                                    ? selectedResource.mlLocation ||
                                      selectedResource.location
                                    : selectedResource.location}
                                </p>
                              )}

                              {selectedResource.contactPhone && (
                                <p>
                                  <span className="text-violet-700">
                                    {language === "en"
                                      ? "Phone: "
                                      : "ഫോൺ: "}
                                  </span>

                                  <a
                                    href={`tel:${selectedResource.contactPhone}`}
                                    className="font-semibold text-indigo-600 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                  >
                                    {selectedResource.contactPhone}
                                  </a>
                                </p>
                              )}

                              {selectedResource.contactEmail && (
                                <p>
                                  <span className="text-violet-700">
                                    {language === "en"
                                      ? "Email: "
                                      : "ഇമെയിൽ: "}
                                  </span>

                                  <a
                                    href={`mailto:${selectedResource.contactEmail}`}
                                    className="font-semibold text-indigo-600 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                  >
                                    {selectedResource.contactEmail}
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* VERIFICATION INFORMATION */}
                        {(language === "ml"
                          ? selectedResource.mlVerificationSource ||
                            selectedResource.verificationSource ||
                            selectedResource.verifiedAt
                          : selectedResource.verificationSource ||
                            selectedResource.verifiedAt) && (
                          <div className="mt-4 rounded-2xl bg-slate-100 p-5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {language === "en"
                                ? "Verification information"
                                : "പരിശോധനാ വിവരം"}
                            </p>

                            <div className="mt-3 space-y-2 text-sm font-bold leading-6 text-[#202b62]">
                              {(language === "ml"
                                ? selectedResource.mlVerificationSource ||
                                  selectedResource.verificationSource
                                : selectedResource.verificationSource) && (
                                <p>
                                  <span className="text-slate-500">
                                    {language === "en"
                                      ? "Verified from: "
                                      : "പരിശോധിച്ചത്: "}
                                  </span>

                                  {language === "ml"
                                    ? selectedResource.mlVerificationSource ||
                                      selectedResource.verificationSource
                                    : selectedResource.verificationSource}
                                </p>
                              )}

                              {selectedResource.verifiedAt && (
                                <p>
                                  <span className="text-slate-500">
                                    {language === "en"
                                      ? "Verified on: "
                                      : "പരിശോധിച്ച തീയതി: "}
                                  </span>

                                  {new Date(
                                    selectedResource.verifiedAt
                                  ).toLocaleDateString(
                                    language === "en"
                                      ? "en-IN"
                                      : "ml-IN",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* OFFICIAL SOURCE */}
                        {selectedResource.sourceUrl && (
                          <div className="mt-4 rounded-2xl bg-cyan-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-700">
                              {language === "en"
                                ? "Official source"
                                : "ഔദ്യോഗിക ഉറവിടം"}
                            </p>

                            <a
                              href={selectedResource.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex text-sm font-black text-[#202b62] underline decoration-cyan-400 underline-offset-4 hover:text-cyan-700"
                            >
                              {language === "en"
                                ? "Open official source"
                                : "ഔദ്യോഗിക ഉറവിടം തുറക്കുക"}

                              <span className="ml-2" aria-hidden="true">
                                ↗
                              </span>
                            </a>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={submitSupportRequest}
                          disabled={requestSubmitting || requestSuccess}
                          className="mt-4 w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-[#202b62] transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {language === "en"
                            ? "Request Help"
                            : "സഹായം അഭ്യർത്ഥിക്കുക"}
                        </button>
                        {requestSubmitting && (
                          <p
                            role="status"
                            className="mt-3 text-center text-sm text-slate-500"
                          >
                            {language === "en"
                              ? "Submitting your request..."
                              : "നിങ്ങളുടെ അഭ്യർത്ഥന സമർപ്പിക്കുന്നു..."}
                          </p>
                        )}

                        {requestSuccess && (
                          <div
                            role="status"
                            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                          >
                            <p className="font-bold">
                              {language === "en"
                                ? "Request submitted successfully."
                                : "അഭ്യർത്ഥന വിജയകരമായി സമർപ്പിച്ചു."}
                            </p>

                            {requestId !== null && (
                              <p className="mt-1">
                                {language === "en"
                                  ? `Request ID: #${requestId}`
                                  : `അഭ്യർത്ഥന നമ്പർ: #${requestId}`}
                              </p>
                            )}
                          </div>
                        )}

                        {requestMessage && (
                          <p
                            role="alert"
                            className="mt-3 text-center text-sm text-red-600"
                          >
                            {requestMessage}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedResource(null)
                          }
                          className="mt-6 rounded-xl bg-[#202b62] px-5 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2b397c]"
                        >
                          {language === "en"
                            ? "Back to support options"
                            : "സഹായ ഓപ്ഷനുകളിലേക്ക് തിരികെ"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">
                            {language === "en"
                              ? "Matching support"
                              : "ലഭ്യമായ സഹായം"}
                          </p>

                          <h4 className="mt-2 text-2xl font-black text-white">
                            {language === "en"
                              ? `${matchingResources.length} support option${
                                  matchingResources.length ===
                                  1
                                    ? ""
                                    : "s"
                                } found`
                              : `${matchingResources.length} സഹായ ഓപ്ഷനുകൾ കണ്ടെത്തി`}
                          </h4>
                        </div>

                                                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/60">
                          {language === "en"
                            ? "Based on your answers"
                            : "നിങ്ങളുടെ ഉത്തരങ്ങൾ അടിസ്ഥാനമാക്കി"}
                        </div>
                      </div>

                        <button
                          type="button"
                          onClick={requestUserLocation}
                          disabled={locationLoading}
                          className="mb-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {locationLoading
                            ? language === "en"
                              ? "Finding your location..."
                              : "നിങ്ങളുടെ ലൊക്കേഷൻ കണ്ടെത്തുന്നു..."
                            : language === "en"
                              ? "📍 Find Nearby Support"
                              : "📍 സമീപത്തുള്ള സഹായം കണ്ടെത്തുക"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRequests(true);
                            loadSupportRequests();
                          }}
                          className="mt-3 rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                          {language === "en"
                            ? "Provider Dashboard"
                            : "സേവനദാതാവ് ഡാഷ്ബോർഡ്"}
                        </button>

                        {locationError && (
                          <p
                            role="alert"
                            className="mb-5 text-sm text-white/70"
                          >
                            {locationError}
                          </p>
                        )}

                        {matchingResources.length > 0 ? (
                          <div className="grid gap-4">
                            {matchingResources.map(
                              (resource, index) => (
                                <div
                                  key={resource.id}
                                  style={{
                                    animationDelay: `${index * 80}ms`,
                                  }}
                                  className="animate-appear rounded-3xl border border-white/10 bg-white p-5 text-[#202b62] shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-6"
                                >
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                  <div
                                    aria-hidden="true"
                                    className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xl text-white shadow-lg"
                                  >
                                    {supportOptions.find(
                                      (option) =>
                                        option.id ===
                                        resource.supportType
                                    )?.icon ?? "✦"}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <div className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                          {language === "ml"
                                            ? categoryMalayalam[
                                                resource.category
                                              ] ||
                                              resource.category
                                            : resource.category}
                                        </div>

                                        <h5 className="text-xl font-black text-[#202b62]">
                                          {language === "ml"
                                            ? resource.mlTitle ||
                                              resource.title
                                            : resource.title}
                                        </h5>
                                      </div>

                                      <span
                                        aria-hidden="true"
                                        className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400"
                                      >
                                        →
                                      </span>
                                    </div>

                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                                      {language === "ml"
                                        ? resource.mlDescription ||
                                          resource.description
                                        : resource.description}
                                    </p>
                                    {resource.locationType === "physical" &&
                                      resource._distanceKm !== null &&
                                      resource._distanceKm !== undefined && (
                                        <p className="mt-2 text-sm font-semibold text-indigo-600">
                                          {resource._distanceKm < 1
                                            ? `${Math.round(resource._distanceKm * 1000)} m away`
                                            : `${resource._distanceKm.toFixed(1)} km away`}
                                        </p>
                                      )}

                                    {resource.locationType === "nationwide" && (
                                      <p className="mt-2 text-sm font-semibold text-emerald-600">
                                        {language === "en"
                                          ? "Available nationwide"
                                          : "രാജ്യമെമ്പാടും ലഭ്യമാണ്"}
                                      </p>
                                    )}
                                    {resource.latitude !== null &&
                                      resource.longitude !== null && (
                                        <a
                                          href={
                                            userLocation
                                              ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${resource.latitude},${resource.longitude}`
                                              : `https://www.google.com/maps/search/?api=1&query=${resource.latitude},${resource.longitude}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-3 inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                        >
                                          {language === "en"
                                            ? "Get directions"
                                            : "വഴികാട്ടി നേടുക"}
                                        </a>
                                      )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedResource(
                                          resource
                                        )
                                      }
                                      className="mt-5 rounded-xl bg-[#202b62] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#2b397c]"
                                    >
                                      {language === "en"
                                        ? "View details"
                                        : "വിശദാംശങ്ങൾ കാണുക"}

                                      <span className="ml-2" aria-hidden="true">
                                        →
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-white/10 bg-white/[.06] p-7 text-center">
                          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-2xl" aria-hidden="true">
                            🔎
                          </div>

                          <h4 className="mt-5 text-xl font-black text-white">
                            {language === "en"
                              ? "No exact matches yet"
                              : "കൃത്യമായ സഹായം കണ്ടെത്താനായില്ല"}
                          </h4>

                          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                            {language === "en"
                              ? "Try changing your support type or previous answer to explore more options."
                              : "കൂടുതൽ ഓപ്ഷനുകൾ കണ്ടെത്താൻ സഹായത്തിന്റെ തരമോ മുമ്പത്തെ ഉത്തരമോ മാറ്റി നോക്കൂ."}
                          </p>

                          <button
                            onClick={goBack}
                            className="mt-5 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-xs font-black text-white transition hover:bg-white/15"
                          >
                            ←{" "}
                            {language === "en"
                              ? "Change answer"
                              : "ഉത്തരം മാറ്റുക"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {showRequests && (
                <section
                  aria-labelledby="provider-dashboard-heading"
                  className="relative mt-8 rounded-3xl border border-white/10 bg-white p-6 text-[#202b62] shadow-2xl sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-600">
                        Provider dashboard
                      </p>

                      <h3
                        id="provider-dashboard-heading"
                        className="mt-2 text-2xl font-black"
                      >
                        {language === "en"
                          ? "Support requests"
                          : "സഹായ അഭ്യർത്ഥനകൾ"}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRequests(false)}
                      className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500"
                      aria-label={
                        language === "en"
                          ? "Close provider dashboard"
                          : "ഡാഷ്ബോർഡ് അടയ്ക്കുക"
                      }
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>

                  {requestsLoading ? (
                    <p
                      role="status"
                      className="mt-6 text-sm text-slate-500"
                    >
                      {language === "en"
                        ? "Loading requests..."
                        : "അഭ്യർത്ഥനകൾ ലോഡ് ചെയ്യുന്നു..."}
                    </p>
                  ) : supportRequests.length === 0 ? (
                    <p className="mt-6 text-sm text-slate-500">
                      {language === "en"
                        ? "No support requests yet."
                        : "ഇതുവരെ സഹായ അഭ്യർത്ഥനകളില്ല."}
                    </p>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {supportRequests.map((request) => (
                        <article
                          key={request.id}
                          className="rounded-2xl border border-slate-200 p-5"
                        >
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Request #{request.id}
                          </p>

                          <h4 className="mt-1 font-black">
                            {language === "ml"
                              ? request.support_resources?.ml_title ||
                                request.support_resources?.title
                              : request.support_resources?.title}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {request.message}
                          </p>

                          <p className="mt-3 font-bold capitalize">
                            {String(request.status).replace("_", " ")}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {request.status === "submitted" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateRequestStatus(
                                    request.id,
                                    "accepted"
                                  )
                                }
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white"
                              >
                                Accept
                              </button>
                            )}

                            {request.status === "accepted" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateRequestStatus(
                                    request.id,
                                    "in_progress"
                                  )
                                }
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white"
                              >
                                Start
                              </button>
                            )}

                            {request.status === "in_progress" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateRequestStatus(
                                    request.id,
                                    "completed"
                                  )
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
                              >
                                Mark completed
                              </button>
                            )}

                            {request.status !== "completed" &&
                              request.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRequestStatus(
                                      request.id,
                                      "cancelled"
                                    )
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
                                >
                                  Cancel
                                </button>
                              )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* CHANGE PREVIOUS ANSWER */}
              <button
                onClick={goBack}
                className="relative mt-6 text-sm font-bold text-white/40 hover:text-[#ff806b]"
              >
                ← {t.change}
              </button>
            </div>

            <div className="border-t border-white/10 px-7 py-5 sm:px-10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/35">
                  ACCESS+ · {language === "en" ? "Step 04" : "ഘട്ടം 04"}
                </span>

                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((item) => (
                    <span
                      key={item}
                      className="size-1.5 rounded-full bg-[#ff806b]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#ff806b]">
                {t.howItWorks}
              </p>

              <h2 className="mt-3 max-w-md text-3xl font-black text-[#202b62] sm:text-4xl">
                {t.supportWithoutConfusion}
              </h2>

              <p className="mt-5 max-w-md leading-7 text-slate-500">
                {t.guidedExperience}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [
                  "01",
                  t.tellUsNeed,
                  t.tellUsNeedDescription,
                ],
                [
                  "02",
                  t.chooseSupport,
                  t.chooseSupportDescription,
                ],
                [
                  "03",
                  t.getResults,
                  t.getResultsDescription,
                ],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="group rounded-[24px] border border-slate-200 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
                >
                  <span className="font-mono text-sm font-black text-[#ff806b]">
                    {number}
                  </span>

                  <h3 className="mt-8 font-black text-[#202b62]">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#202b62]">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            [
              "♿",
              t.assistiveDevices,
              t.assistiveDevicesDescription,
            ],
            [
              "🏛️",
              t.governmentSupport,
              t.governmentSupportDescription,
            ],
            [
              "🤝",
              t.serviceProviders,
              t.serviceProvidersDescription,
            ],
            [
              "🔧",
              t.repairs,
              t.repairsDescription,
            ],
          ].map(([icon, title, description]) => (
            <div
              key={title}
              className="group rounded-3xl border border-white/10 bg-white/[.05] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/[.09]"
            >
              <div className="text-3xl transition group-hover:scale-110" aria-hidden="true">
                {icon}
              </div>

              <h4 className="mt-5 font-black text-white">
                {title}
              </h4>

              <p className="mt-2 text-sm leading-6 text-white/45">
                {description}
              </p>

              <div className="mt-5 h-px w-10 bg-[#ff806b] transition-all duration-300 group-hover:w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* TRACK REQUEST
          Moved above the footer and given a dark card: it used to sit after
          the footer with white text on a light background (invisible). */}
      <section
        aria-labelledby="track-request-heading"
        className="mx-auto max-w-5xl px-5 pb-16 pt-4 lg:px-8"
      >
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#202b62] p-6 text-white">
          <h3
            id="track-request-heading"
            className="text-xl font-black"
          >
            {language === "en"
              ? "Track your request"
              : "നിങ്ങളുടെ അഭ്യർത്ഥന പരിശോധിക്കുക"}
          </h3>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label
              htmlFor="request-id"
              className="sr-only"
            >
              Request ID
            </label>

            <input
              id="request-id"
              value={trackingId}
              onChange={(event) =>
                setTrackingId(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  trackSupportRequest();
                }
              }}
              inputMode="numeric"
              placeholder={
                language === "en"
                  ? "Enter request ID"
                  : "അഭ്യർത്ഥന നമ്പർ നൽകുക"
              }
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white px-4 py-3 text-[#202b62] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            />

            <button
              type="button"
              onClick={trackSupportRequest}
              disabled={trackingLoading}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-[#202b62] disabled:opacity-50"
            >
              {trackingLoading
                ? language === "en"
                  ? "Checking..."
                  : "പരിശോധിക്കുന്നു..."
                : language === "en"
                  ? "Track"
                  : "പരിശോധിക്കുക"}
            </button>
          </div>

          {trackMessage && (
            <p
              role="alert"
              className="mt-4 text-sm font-semibold text-white/80"
            >
              {trackMessage}
            </p>
          )}

          {trackedRequest && (
            <div
              role="status"
              className="mt-5 rounded-2xl bg-white p-5 text-[#202b62]"
            >
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Request #{trackedRequest.id}
              </p>

              <h4 className="mt-1 font-black">
                {language === "ml"
                  ? trackedRequest.support_resources?.ml_title ||
                    trackedRequest.support_resources?.title
                  : trackedRequest.support_resources?.title}
              </h4>

              <p className="mt-3 font-bold capitalize">
                Status: {String(trackedRequest.status).replace("_", " ")}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Last updated:{" "}
                {trackedRequest.updated_at
                  ? new Date(
                      trackedRequest.updated_at
                    ).toLocaleString()
                  : "—"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#171e48] px-5 py-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-lg font-black text-white">
          A<span className="text-[#ff806b]">+</span>
        </div>

        <div className="mt-4 text-sm font-black tracking-[.15em] text-white">
          ACCESS+
        </div>

        <p className="mt-2 text-xs text-white/35">
          {t.footerTagline}
        </p>
      </footer>
    </main>
  </>
  );
}