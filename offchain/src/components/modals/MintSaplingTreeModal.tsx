import React, { useState } from 'react'
import TreeSpeciesSelector from '../TreeSpeciesSelector';


interface MintSeedModalProps {
    treeType: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (treeType: string, image: File | null) => void;
}


const MintSeedModal = ({ treeType, isOpen, onClose, onConfirm }: MintSeedModalProps) => {
 
    const [image, setImage] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
            <div className="modal-box">
                <h3 className="font-bold text-lg">Mint {treeType} NFT</h3>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text text-sm font-semibold">Upload Image</span>
                    </label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="file-input file-input-bordered w-full max-w-xs"
                    />
                </div>
               
                <div className="modal-action">
                    <button
                        onClick={onClose}
                        className="btn btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(treeType, image)}
                        className="btn btn-primary"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MintSeedModal