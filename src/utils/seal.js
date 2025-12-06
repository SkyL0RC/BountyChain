// Seal Protocol Integration (Programmable Encryption on Sui)
// https://docs.seal.io/

/**
 * Seal encryption utility
 * PoC dosyalarını sadece bounty sahibinin decrypt edebileceği şekilde şifreler
 */

export class SealClient {
  constructor() {
    // Seal production'da gerçek encryption kullanacak
    // Şimdilik basit bir wrapper yapıyoruz
  }

  /**
   * Dosyayı bounty sahibi için şifrele
   * @param {Blob} file - Şifrelenecek dosya
   * @param {string} bountyOwnerAddress - Sadece bu adres decrypt edebilir
   * @returns {Promise<{encryptedData: Uint8Array, metadata: Object}>}
   */
  async encryptFile(file, bountyOwnerAddress) {
    try {
      // Dosyayı bytes'a çevir
      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      // TODO: Gerçek Seal encryption entegrasyonu
      // Şimdilik basit metadata oluşturuyoruz
      const metadata = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        encryptedFor: bountyOwnerAddress,
        timestamp: Date.now(),
        version: '1.0.0'
      };

      // Metadata'yı string'e çevir
      const metadataString = JSON.stringify(metadata);
      const metadataBytes = new TextEncoder().encode(metadataString);

      // Encrypted data = metadata + file (production'da gerçekten şifrelenecek)
      const encryptedData = new Uint8Array(metadataBytes.length + fileBytes.length);
      encryptedData.set(metadataBytes, 0);
      encryptedData.set(fileBytes, metadataBytes.length);

      return {
        encryptedData,
        metadata: {
          ...metadata,
          metadataSize: metadataBytes.length,
          totalSize: encryptedData.length
        }
      };
    } catch (error) {
      console.error('Seal encryption error:', error);
      throw error;
    }
  }

  /**
   * Şifreli dosyayı decrypt et (sadece authorized kullanıcı)
   * @param {Uint8Array} encryptedData 
   * @param {string} userAddress - Decrypt eden kullanıcı
   * @returns {Promise<{file: Blob, metadata: Object}>}
   */
  async decryptFile(encryptedData, userAddress) {
    try {
      // TODO: Gerçek Seal decryption + authorization check
      
      // Şimdilik basit parse
      // İlk kısım metadata (JSON)
      const metadataEnd = this.findMetadataEnd(encryptedData);
      const metadataBytes = encryptedData.slice(0, metadataEnd);
      const fileBytes = encryptedData.slice(metadataEnd);

      const metadataString = new TextDecoder().decode(metadataBytes);
      const metadata = JSON.parse(metadataString);

      // Authorization check
      if (metadata.encryptedFor !== userAddress) {
        throw new Error('Unauthorized: You cannot decrypt this file');
      }

      // Blob oluştur
      const file = new Blob([fileBytes], { type: metadata.fileType });

      return {
        file,
        metadata
      };
    } catch (error) {
      console.error('Seal decryption error:', error);
      throw error;
    }
  }

  /**
   * Helper: Metadata'nın bittiği yeri bul
   */
  findMetadataEnd(data) {
    // JSON metadata '}}' ile bitecek
    const searchString = '}}';
    const searchBytes = new TextEncoder().encode(searchString);
    
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i] === searchBytes[0] && data[i + 1] === searchBytes[1]) {
        return i + 2; // '}}'den sonrası file data
      }
    }
    return 0;
  }

  /**
   * Encrypted data'yı base64'e çevir (Move kontratı için)
   * @param {Uint8Array} encryptedData 
   * @returns {string}
   */
  toBase64(encryptedData) {
    let binary = '';
    for (let i = 0; i < encryptedData.length; i++) {
      binary += String.fromCharCode(encryptedData[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64'ten encrypted data'ya çevir
   * @param {string} base64String 
   * @returns {Uint8Array}
   */
  fromBase64(base64String) {
    const binary = atob(base64String);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Metadata hash oluştur (duplicate check için)
   * @param {Object} metadata 
   * @returns {Promise<string>}
   */
  async generateMetadataHash(metadata) {
    const metadataString = JSON.stringify(metadata);
    const encoder = new TextEncoder();
    const data = encoder.encode(metadataString);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * File hash oluştur (Walrus blob ile birlikte kullanmak için)
   * @param {File} file 
   * @returns {Promise<string>}
   */
  async generateFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
}

// Singleton instance
let sealClient = null;

export function getSealClient() {
  if (!sealClient) {
    sealClient = new SealClient();
  }
  return sealClient;
}

export default SealClient;
