// ----------------------------------------------------------------------

// Un champ de formulaire étiqueté — même habillage (label + input) que
// partout ailleurs dans l'admin (voir AddMemberModal, AddTrainingModal),
// pour rester cohérent avec le reste du site.
export function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-400";

export function TextInput(props) {
  return <input {...props} className={INPUT_CLASS} />;
}

export function Select({ options, ...props }) {
  return (
    <select {...props} className={INPUT_CLASS}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
