// Walrus SDK Integration
// https://docs.walrus.site/

export class WalrusClient {
  constructor(network = 'testnet') {
    // Walrus aggregator endpoints
    this.endpoints = {
      testnet: 'https://aggregator.walrus-testnet.walrus.space',
      mainnet: 'https://aggregator.walrus.space'
    };
    this.baseUrl = this.endpoints[network];
  }

  /**
   * Dosyayı Walrus'a yükle ve blob ID al
   * @param {File} file - Yüklenecek dosya
   * @param {number} epochs - Kaç epoch saklanacak (1 epoch ≈ 1 gün)
   * @returns {Promise<{blobId: string, suiRef: string}>}
   */
  async uploadFile(file, epochs = 30) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/v1/store?epochs=${epochs}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Walrus upload failed: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Walrus response format:
      // {
      //   "newlyCreated": {
      //     "blobObject": {
      //       "id": "0x...",
      //       "storedEpoch": 123,
      //       "blobId": "abc123...",
      //       "size": 1024,
      //       "erasureCodeType": "RedStuff",
      //       "certifiedEpoch": 123
      //     }
      //   }
      // }
      
      if (result.newlyCreated) {
        return {
          blobId: result.newlyCreated.blobObject.blobId,
          suiRef: result.newlyCreated.blobObject.id,
          size: result.newlyCreated.blobObject.size,
          storedEpoch: result.newlyCreated.blobObject.storedEpoch
        };
      } else if (result.alreadyCertified) {
        // Dosya zaten Walrus'ta var
        return {
          blobId: result.alreadyCertified.blobId,
          suiRef: result.alreadyCertified.id,
          size: result.alreadyCertified.size,
          storedEpoch: result.alreadyCertified.storedEpoch
        };
      }

      throw new Error('Unexpected Walrus response format');
    } catch (error) {
      console.error('Walrus upload error:', error);
      throw error;
    }
  }

  /**
   * Blob ID'den dosyayı indir
   * @param {string} blobId - Walrus blob ID
   * @returns {Promise<Blob>}
   */
  async downloadFile(blobId) {
    try {
      const response = await fetch(`${this.baseUrl}/v1/${blobId}`);
      
      if (!response.ok) {
        throw new Error(`Walrus download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Walrus download error:', error);
      throw error;
    }
  }

  /**
   * Blob metadata al
   * @param {string} blobId - Walrus blob ID
   * @returns {Promise<Object>}
   */
  async getBlobInfo(blobId) {
    try {
      const response = await fetch(`${this.baseUrl}/v1/${blobId}/info`);
      
      if (!response.ok) {
        throw new Error(`Walrus info failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Walrus info error:', error);
      throw error;
    }
  }

  /**
   * Progress tracking ile dosya yükle
   * @param {File} file 
   * @param {Function} onProgress - (percent) => void
   * @param {number} epochs 
   */
  async uploadFileWithProgress(file, onProgress, epochs = 30) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.newlyCreated) {
              resolve({
                blobId: result.newlyCreated.blobObject.blobId,
                suiRef: result.newlyCreated.blobObject.id,
                size: result.newlyCreated.blobObject.size,
                storedEpoch: result.newlyCreated.blobObject.storedEpoch
              });
            } else if (result.alreadyCertified) {
              resolve({
                blobId: result.alreadyCertified.blobId,
                suiRef: result.alreadyCertified.id,
                size: result.alreadyCertified.size,
                storedEpoch: result.alreadyCertified.storedEpoch
              });
            } else {
              reject(new Error('Unexpected Walrus response format'));
            }
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      const formData = new FormData();
      formData.append('file', file);

      xhr.open('PUT', `${this.baseUrl}/v1/store?epochs=${epochs}`);
      xhr.send(formData);
    });
  }

  /**
   * Blob ID'yi bytes array'e çevir (Move kontratı için)
   * @param {string} blobId - Hex string
   * @returns {Uint8Array}
   */
  blobIdToBytes(blobId) {
    // "0x" prefix varsa kaldır
    const cleanHex = blobId.startsWith('0x') ? blobId.slice(2) : blobId;
    
    // Hex to bytes
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Bytes array'i blob ID'ye çevir
   * @param {Uint8Array} bytes 
   * @returns {string}
   */
  bytesToBlobId(bytes) {
    return '0x' + Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Singleton instance
let walrusClient = null;

export function getWalrusClient(network = 'testnet') {
  if (!walrusClient) {
    walrusClient = new WalrusClient(network);
  }
  return walrusClient;
}

export default WalrusClient;
