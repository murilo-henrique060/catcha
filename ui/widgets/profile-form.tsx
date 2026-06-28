'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaKey, FaSignOutAlt, FaTrashAlt } from "react-icons/fa";
import { updateUsername, deleteAccount, checkUsernameExists } from "@/lib/controllers/UserController";
import { logout } from "@/lib/controllers/AuthController";
import { useUser } from "@/lib/contexts/UserContext";

type ProfileFormProps = {
  initialEmail: string | null;
  initialUsername: string;
};

export function ProfileForm({ initialEmail, initialUsername }: ProfileFormProps) {
  const router = useRouter();
  const { refreshProfile } = useUser();
  const [username, setUsername] = useState(initialUsername);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    setUsernameSuccess("");
    
    if (val.trim() === initialUsername) {
      setUsernameError("");
      return;
    }

    if (val.trim().length < 3) {
      setUsernameError("O nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }

    if (val.trim().length > 20) {
      setUsernameError("O nome de usuário deve ter no máximo 20 caracteres");
      return;
    }

    setUsernameError("");
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed === initialUsername) return;

    if (trimmed.length < 3 || trimmed.length > 20) {
      setUsernameError("O nome de usuário deve ter entre 3 e 20 caracteres");
      return;
    }

    setIsUpdatingUsername(true);
    setUsernameError("");
    setUsernameSuccess("");

    // Check if username is already registered (excluding the user's current username)
    const isTaken = await checkUsernameExists(trimmed);
    if (isTaken) {
      setUsernameError("Este nome de usuário já está em uso");
      setIsUpdatingUsername(false);
      return;
    }

    const result = await updateUsername(trimmed);
    setIsUpdatingUsername(false);

    if (result.error) {
      setUsernameError(result.error);
    } else {
      setUsernameSuccess("Nome de usuário atualizado com sucesso!");
      await refreshProfile();
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const result = await deleteAccount();
    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
      setShowDeleteModal(false);
    } else {
      router.push("/auth/register");
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col">
      <div className="text-center border-b border-gray-100 pb-4">
        <h2 className="text-[24px] font-bold italic uppercase tracking-wider text-[#B01070]">
          Perfil do Jogador
        </h2>
      </div>

      {/* Email Read-only block */}
      <div className="flex flex-col gap-1.5 mt-6">
        <label className="text-[14px] font-bold text-gray-500 flex items-center gap-1.5">
          <FaEnvelope className="text-[14px] text-gray-400" />
          E-mail
        </label>
        <input
          type="email"
          disabled
          value={initialEmail || "Não informado"}
          className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-[15px] text-gray-400 cursor-not-allowed"
        />
      </div>

      {/* Change Username Form */}
      <form onSubmit={handleUpdateUsername} className="flex flex-col gap-1 py-2.5 mt-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-bold text-gray-500 flex items-center gap-1.5">
            <FaUser className="text-[14px] text-gray-400" />
            Nome de Usuário
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className={[
                "flex-grow rounded-lg border px-4 py-2.5 text-[15px] outline-none transition-all",
                usernameError ? "border-red-500 focus:border-red-500 bg-red-50/20" : "border-gray-200 focus:border-[#B01070]"
              ].join(" ")}
            />
            <button
              type="submit"
              disabled={username.trim() === initialUsername || isUpdatingUsername || !!usernameError}
              className={[
                "rounded-lg bg-[#D30076] hover:bg-[#B90067] px-5 text-[15px] font-bold text-white shadow-md transition-all uppercase leading-none",
                (username.trim() === initialUsername || isUpdatingUsername || !!usernameError) ? "opacity-50 cursor-not-allowed shadow-none" : ""
              ].join(" ")}
            >
              {isUpdatingUsername ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
        {usernameError && <p className="text-red-500 text-[13px] font-medium">{usernameError}</p>}
        {usernameSuccess && <p className="text-green-600 text-[13px] font-medium">{usernameSuccess}</p>}
      </form>

      {/* Other actions list */}
      <div className="flex flex-col gap-3.5 mt-2 border-t border-gray-100 pt-4">
        {/* Alterar Senha */}
        <button
          type="button"
          onClick={() => router.push("/auth/change-password")}
          className="flex items-center justify-between rounded-xl border border-gray-200 hover:border-[#B01070]/30 hover:bg-[#FCE8F4]/30 p-4 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FCE8F4] text-[#B01070]">
              <FaKey className="text-[16px]" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-gray-800">Alterar Senha</p>
              <p className="text-[13px] text-gray-500">Atualize sua senha de acesso</p>
            </div>
          </div>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/auth/login");
          }}
          className="flex items-center justify-between rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 p-4 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 text-gray-600">
              <FaSignOutAlt className="text-[16px]" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-gray-800">Sair da Conta</p>
              <p className="text-[13px] text-gray-500">Encerrar a sessão ativa</p>
            </div>
          </div>
        </button>

        {/* Delete Account */}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center justify-between rounded-xl border border-red-100 hover:border-red-200 hover:bg-red-50/50 p-4 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
              <FaTrashAlt className="text-[16px]" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-red-600">Excluir Conta</p>
              <p className="text-[13px] text-gray-500">Deletar todos os seus dados permanentemente</p>
            </div>
          </div>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] rounded-[32px] bg-white border border-red-100 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex flex-col items-center gap-6">
            
            {/* Modal Title */}
            <h3 className="text-[22px] font-bold italic uppercase tracking-wider text-red-600">
              Excluir Conta
            </h3>

            {/* Trash icon */}
            <div className="flex items-center justify-center border-4 border-red-100 rounded-full p-4 w-20 h-20 bg-red-50">
              <FaTrashAlt className="text-[32px] text-red-600" />
            </div>

            {/* Confirm text */}
            <p className="text-[17px] text-gray-700 font-medium px-4">
              Deseja realmente excluir sua conta? Todos os seus dados serão apagados permanentemente.
            </p>

            {/* Sim/Não Action Buttons */}
            <div className="flex gap-4 w-full justify-center">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="w-full max-w-[140px] rounded-full bg-red-600 hover:bg-red-500 px-6 py-2.5 text-[16px] font-bold uppercase text-white shadow-[0_4px_12px_rgba(220,38,38,0.3)] transition-colors duration-200"
              >
                {isDeleting ? "Excluindo..." : "Sim"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="w-full max-w-[140px] rounded-full bg-gray-600 hover:bg-gray-500 px-6 py-2.5 text-[16px] font-bold uppercase text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-colors duration-200"
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
