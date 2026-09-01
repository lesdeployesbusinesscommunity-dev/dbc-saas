// Import Dependencies
import PropTypes from "prop-types";
import clsx from "clsx";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

// Local Imports
import { AccordionButton, AccordionItem, AccordionPanel } from "components/ui";
import { useLocaleContext } from "app/contexts/locale/context";
import { MenuItem } from "./MenuItem";

// ----------------------------------------------------------------------

export function CollapsibleItem({ data }) {
  const { path, childs, transKey } = data;

  const { t } = useTranslation();
  const { isRtl } = useLocaleContext();
  const title = t(transKey) || data.title;

  const Icon = isRtl ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <AccordionItem value={path}>
      {({ open }) => (
        <>
          <AccordionButton
            className={clsx(
              "flex w-full min-w-0 items-center justify-between gap-1 py-2 text-start text-xs+ tracking-wide outline-none transition-[color,padding-left,padding-right] duration-300 ease-in-out",
              open
                ? "font-semibold text-gray-800 dark:text-dark-50"
                : "text-gray-600 hover:text-gray-800 focus:text-gray-800 dark:text-dark-200 dark:hover:text-dark-50 dark:focus:text-dark-50",
            )}
          >
            <span className="truncate">{title}</span>
            <Icon
              className={clsx(
                "size-4 text-gray-400 transition-transform ease-in-out dark:text-dark-200",
                open && [isRtl ? "-rotate-90" : "rotate-90"],
              )}
            />
          </AccordionButton>
          <AccordionPanel>
            {childs.map((i) => (
              <MenuItem key={i.path} data={i} />
            ))}
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  );
}

CollapsibleItem.propTypes = {
  data: PropTypes.object,
};
