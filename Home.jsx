import React, { useState, useEffect } from 'react';  
import './Home.css';  
import axios from 'axios';  
import { useNavigate } from 'react-router-dom';

function Home() {  
  const navigate = useNavigate();
  const [popup, setPopup] = useState(false);  
  const [products, setProducts] = useState([]);  
  
  const [Details, setDetails] = useState({  
    id: '',  
    name: '',  
    description: '',
    price: '',
    quantity: ''  
  });  
  
  const [isEditing, setIsEditing] = useState(false);  
  
  useEffect(() => {  
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProducts();  
  }, [navigate]);  
  
  async function fetchProducts() {  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await axios.get(  
        'http://localhost:5000/products',  
        {  
          headers: {  
            Authorization: `Bearer ${token}`  
          }  
        }  
      );  
    
      console.log('Products fetched:', response.data);  
      setProducts(response.data);  
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }  
  
  function handleClick() {  
    setDetails({  
      id: '',  
      name: '',  
      description: '',
      price: '',
      quantity: ''  
    });  
  
    setIsEditing(false);  
    setPopup(true);  
  }  
  
  function handleChange(event) {  
    const { name, value } = event.target;  
  
    setDetails((prev) => ({  
      ...prev,  
      [name]: value  
    }));  
  }  
  
  async function handleClickSubmit(event) {  
    event.preventDefault();  
  
    console.log('Submit clicked');  
    console.log('Details:', Details);  
  
    if (!Details.name.trim() || !Details.description.trim() || Details.price === '' || Details.quantity === '') {  
      alert('Please fill in all fields (Name, Description, Price, Quantity)');  
      return;  
    }  
  
    try {
      if (isEditing) {  
        const response = await axios.put(  
          `http://localhost:5000/product/${Details.id}`,  
          {  
            name: Details.name,  
            description: Details.description,
            price: Number(Details.price),
            quantity: Number(Details.quantity)  
          },  
          {  
            headers: {  
              Authorization: `Bearer ${localStorage.getItem("token")}`  
            }  
          }  
        );  
    
        console.log('Update response:', response.data);  
      } else {  
        const response = await axios.post(  
          'http://localhost:5000/products',  
          {  
            name: Details.name,  
            description: Details.description,
            price: Number(Details.price),
            quantity: Number(Details.quantity)  
          },  
          {  
            headers: {  
              Authorization: `Bearer ${localStorage.getItem("token")}`  
            }  
          }  
        );  
    
        console.log('Add response:', response.data);  
      }  
    
      await fetchProducts();  
    
      setDetails({  
        id: '',  
        name: '',  
        description: '',
        price: '',
        quantity: ''  
      });  
    
      setIsEditing(false);  
      setPopup(false);  
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Failed to save product');
    }
  }  
  
  async function deleteProduct(id) {  
    try {
      const response = await axios.delete(  
        `http://localhost:5000/product/${id}`,  
        {  
          headers: {  
            Authorization: `Bearer ${localStorage.getItem("token")}`  
          }  
        }  
      );  
    
      console.log('Delete response:', response.data);  
      await fetchProducts();  
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  }  
  
  function editProduct(product) {  
    setDetails({  
      id: product.id,  
      name: product.name,  
      description: product.description,
      price: product.price,
      quantity: product.quantity  
    });  
  
    setIsEditing(true);  
    setPopup(true);  
  }  
  
  function closePopup() {  
    setPopup(false);  
  
    setDetails({  
      id: '',  
      name: '',  
      description: '',
      price: '',
      quantity: ''  
    });  
  
    setIsEditing(false);  
  }  
  
  return (  
    <div className="HomePage">  
  
      <div className="action-bar">  
        <button  
          className="create-btn"  
          onClick={handleClick}  
        >  
          Add Product  
        </button>  
      </div>  
  
      <div className="products-container">  
        {products.length === 0 ? (
          <p className="no-products">No products available. Click "Add Product" to add one.</p>
        ) : (
          products.map((product) => (  
            <div  
              className="card"  
              key={product.id}  
            >  
              <h3 className="card-title">  
                {product.name}  
              </h3>  
    
              <p className="card-description">  
                {product.description}  
              </p>  

              <div className="card-details">
                <span className="card-price">
                  Price: ₹{product.price}
                </span>
                <span className="card-quantity">
                  Quantity: {product.quantity}
                </span>
              </div>
    
              <div className="card-buttons">  
                <button  
                  className="edit-btn"  
                  onClick={() => editProduct(product)}  
                >  
                  Edit  
                </button>  
    
                <button  
                  className="delete-btn"  
                  onClick={() => deleteProduct(product.id)}  
                >  
                  Delete  
                </button>  
              </div>  
            </div>  
          ))
        )}  
      </div>  
  
      {popup && (  
        <div className="Home-Overlay">  
  
          <div className="Form">  
  
            <button  
              className="Close-Button"  
              onClick={closePopup}  
            >  
              &times;  
            </button>  
  
            <form  
              className="Product-Form"  
              onSubmit={handleClickSubmit}  
            >  
  
              <h2>  
                {isEditing ? 'Edit Product' : 'Add New Product'}  
              </h2>  
  
              <input  
                type="text"  
                placeholder="Product Name"  
                name="name"  
                value={Details.name}  
                onChange={handleChange}  
                required  
              />  
  
              <input  
                type="text"  
                placeholder="Description"  
                name="description"  
                value={Details.description}  
                onChange={handleChange}  
                required  
              />  

              <input  
                type="number"  
                placeholder="Price"  
                name="price"  
                value={Details.price}  
                onChange={handleChange}  
                min="0"
                step="any"
                required  
              />  

              <input  
                type="number"  
                placeholder="Quantity"  
                name="quantity"  
                value={Details.quantity}  
                onChange={handleChange}  
                min="0"
                required  
              />  
  
              <button  
                type="submit"  
                className="submit-btn"  
              >  
                {isEditing ? 'Update' : 'Submit'}  
              </button>  
  
            </form>  
  
          </div>  
  
        </div>  
      )}  
  
    </div>  
  );  
}  
  
export default Home;  
      