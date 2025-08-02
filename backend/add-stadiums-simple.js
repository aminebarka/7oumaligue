const { PrismaClient } = require('@prisma/client');

async function addStadiums() {
  console.log('🏟️ Ajout de stades de test...');
  
  const prisma = new PrismaClient();
  
  try {
    // Vérifier s'il y a déjà des stades
    const existingStadiums = await prisma.stadium.findMany();
    console.log(`📊 Stades existants: ${existingStadiums.length}`);
    
    if (existingStadiums.length > 0) {
      console.log('✅ Des stades existent déjà');
      existingStadiums.forEach((stadium, index) => {
        console.log(`  ${index + 1}. ${stadium.name} - ${stadium.city}`);
      });
      return;
    }
    
    // Ajouter des stades de test
    const stadiums = [
      {
        name: "Stade Municipal de Casablanca",
        address: "Boulevard Mohammed V",
        city: "Casablanca",
        region: "Casablanca-Settat",
        capacity: "45000",
        fieldCount: "2",
        fieldTypes: ["Football 11", "Football 7"],
        amenities: ["Parking", "Vestiaires", "Éclairage"],
        description: "Stade principal de Casablanca",
        isPartner: true
      },
      {
        name: "Complexe Sportif Al Amal",
        address: "Route de Salé",
        city: "Rabat",
        region: "Rabat-Salé-Kénitra",
        capacity: "12000",
        fieldCount: "3",
        fieldTypes: ["Football 11", "Football 7", "Football 5"],
        amenities: ["Parking", "Vestiaires", "Cafétéria"],
        description: "Complexe sportif moderne",
        isPartner: true
      },
      {
        name: "Stade Prince Moulay Abdellah",
        address: "Avenue Hassan II",
        city: "Rabat",
        region: "Rabat-Salé-Kénitra",
        capacity: "52000",
        fieldCount: "1",
        fieldTypes: ["Football 11"],
        amenities: ["Parking", "Vestiaires", "Tribunes"],
        description: "Stade national du Maroc",
        isPartner: false
      },
      {
        name: "Complexe Sportif Mohammed V",
        address: "Boulevard Zerktouni",
        city: "Casablanca",
        region: "Casablanca-Settat",
        capacity: "67000",
        fieldCount: "1",
        fieldTypes: ["Football 11"],
        amenities: ["Parking", "Vestiaires", "Tribunes"],
        description: "Grand stade de Casablanca",
        isPartner: false
      },
      {
        name: "Stade Ibn Batouta",
        address: "Route de Tétouan",
        city: "Tanger",
        region: "Tanger-Tétouan-Al Hoceima",
        capacity: "45000",
        fieldCount: "1",
        fieldTypes: ["Football 11"],
        amenities: ["Parking", "Vestiaires", "Tribunes"],
        description: "Stade principal de Tanger",
        isPartner: false
      }
    ];
    
    console.log('📝 Ajout de 5 stades de test...');
    
    for (const stadiumData of stadiums) {
      const stadium = await prisma.stadium.create({
        data: stadiumData
      });
      console.log(`✅ Ajouté: ${stadium.name} - ${stadium.city}`);
    }
    
    console.log('🎉 Tous les stades ont été ajoutés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des stades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addStadiums(); 